import { GoogleGenerativeAI } from '@google/generative-ai';

const MAX_TEXT_LENGTH = 200000;
const MAX_BASE64_LENGTH = 20_000_000;
const MAX_FILES = 3;
const MAX_FILE_BASE64_LENGTH = 20_000_000;
const ALLOWED_FILE_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg']);
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;
const rateLimits = new Map();

function sanitizeText(input) {
    return String(input || '')
        .replace(/\r\n?/g, '\n')
        .replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, MAX_TEXT_LENGTH);
}

function validateBase64Pdf(data) {
    return typeof data === 'string'
        && data.length <= MAX_BASE64_LENGTH
        && data.startsWith('JVBERi0')
        && /^[A-Za-z0-9+/=\s]+$/.test(data);
}

function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.socket?.remoteAddress
        || 'unknown';
}

function isRateLimited(key) {
    const now = Date.now();
    const entry = rateLimits.get(key) || { count: 0, first: now };
    if (now - entry.first > RATE_LIMIT_WINDOW_MS) {
        entry.count = 1;
        entry.first = now;
    } else {
        entry.count += 1;
    }
    rateLimits.set(key, entry);
    return entry.count > MAX_REQUESTS_PER_WINDOW;
}

export const maxDuration = 60; // Max timeout for Vercel Hobby

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb', // Vercel Hobby max gräns
    },
  },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Läs Firebase ID token från Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Obehörig - saknar token' });
    }
    const token = authHeader.split('Bearer ')[1];

    try {
        // Verifiera token mot Firebase REST API eftersom vi saknar firebase-admin
        const verifyRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.VITE_FIREBASE_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: token })
        });

        if (!verifyRes.ok) {
            return res.status(401).json({ error: 'Ogiltig session' });
        }

        const data = await verifyRes.json();
        const user = data.users?.[0];

        const adminEmail = process.env.ADMIN_EMAIL || 'frebrandberg@gmail.com';
        if (!user || user.email !== adminEmail || !user.emailVerified) {
            return res.status(403).json({ error: 'Åtkomst nekad - fel konto' });
        }
    } catch (err) {
        console.error('Token verification error:', err);
        return res.status(500).json({ error: 'Serverfel vid verifiering' });
    }

    const clientIp = getClientIp(req);
    if (isRateLimited(clientIp)) {
        return res.status(429).json({ error: 'För många förfrågningar. Försök igen om en minut.' });
    }

    const { pdfBase64, files, pdfText } = req.body;
    
    const fileParts = [];

    if (pdfText && typeof pdfText === 'string' && pdfText.trim()) {
        const safeText = sanitizeText(pdfText);
        if (safeText) {
            fileParts.push("Här är textinnehållet från årsredovisningen:\n" + safeText);
        }
    }

    if (pdfBase64) {
        if (!validateBase64Pdf(pdfBase64)) {
            return res.status(400).json({ error: 'Ogiltig eller för stor PDF-data.' });
        }
        fileParts.push({
            inlineData: {
                data: pdfBase64.replace(/\s+/g, ''),
                mimeType: 'application/pdf'
            }
        });
    }

    if (files && Array.isArray(files)) {
        if (files.length > MAX_FILES) {
            return res.status(400).json({ error: `Max ${MAX_FILES} filer får skickas.` });
        }

        for (let i = 0; i < files.length; i += 1) {
            const file = files[i];
            if (!file || typeof file !== 'object' || typeof file.data !== 'string' || typeof file.mimeType !== 'string') {
                return res.status(400).json({ error: 'Ogiltigt filformat i upload.' });
            }
            if (!ALLOWED_FILE_TYPES.has(file.mimeType)) {
                return res.status(400).json({ error: 'Endast PDF, PNG och JPEG tillåts.' });
            }
            if (file.data.length > MAX_FILE_BASE64_LENGTH) {
                return res.status(400).json({ error: 'En av filerna är för stor.' });
            }
            if (!/^[A-Za-z0-9+/=\s]+$/.test(file.data)) {
                return res.status(400).json({ error: 'Ogiltig fildata i upload.' });
            }
            fileParts.push({
                inlineData: {
                    data: file.data.replace(/\s+/g, ''),
                    mimeType: file.mimeType
                }
            });
        }
    }

    if (fileParts.length === 0) {
        return res.status(400).json({ error: 'Ingen giltig data skickades med för analys.' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    try {

        const systemPrompt = `Du är en expert på att analysera svenska årsredovisningar för bostadsrättsföreningar.
Läs igenom bifogad årsredovisning och extrahera data för de TRE SENASTE ÅREN som redovisas.
Hitta och bedöm följande nyckeltal för alla tre åren enligt mina strikta regler:

1. Skuldsättning / kvm upplåten bostadsrätt
   - Bra: under 8000
   - Dåligt: över 15000
   - Mellan: annars

2. Sparande per kvadratmeter
   - Bra: över 200
   - Dåligt: under 120
   - Mellan: annars

3. Räntekänslighet (%)
   - Bra: under 5
   - Dåligt: över 10
   - Mellan: annars
   - MÅSTE anges med en decimal (t.ex. 4.5 %)

4. Energikostnad per kvadratmeter
   - Bra: under 200
   - Dåligt: över 200
   - Mellan: annars (notera, exakt 200 kan vara mellan)

5. Årsavgift / kvm upplåten bostadsrätt
   - Bra: under 800
   - Dåligt: över 1000
   - Mellan: annars

Svara ENDAST med giltig JSON utan markdown-formatering. Inga backticks.
Alla siffror MÅSTE formateras med svenskt talformat: mellanslag som tusentalsavskiljare och kommatecken som decimalavskiljare (t.ex. 12 500 kr, 4,5 %).
Leta reda på de faktiska årtalen (t.ex. "2023", "2022", "2021") och ange dem i "years"-arrayen med det senaste året först.
Dessutom, identifiera och ange bostadsrättsföreningens (BRF) fullständiga namn i fältet "brfName".
Samt, identifiera om marken innehas med äganderätt eller tomträtt. Ange detta i fältet "landOwnership" som antingen "Äganderätt", "Tomträtt" eller "Okänt".
Samt, identifiera om föreningen klassas som ett "Äkta bostadsföretag" (privatbostadsföretag) eller "Oäkta". Ange detta i fältet "isGenuine" som antingen "Äkta", "Oäkta" eller "Okänt".
Samt, identifiera och lista ALLA föreningens lån. Ange detta i fältet "loans" som en lista (array) av objekt, där varje objekt har "year" (årtal för omförhandling / villkorsändring), "amount" (belopp i kr), och "interestRate" (nuvarande ränta). Returnera en tom lista [] om föreningen är skuldfri. Sortera listan så att de lån som har närmast villkorsändring ligger överst.
Samt, identifiera antalet bostäder, hyresrätter, lokaler och parkeringsplatser i föreningen. Ange detta i ett objekt "properties" med numreriska värden (inte strängar) för nycklarna "apartments" (totalt antal bostäder/lägenheter), "rentals" (antal hyresrätter), "commercialSpaces" (antal lokaler), "parkingSpaces" (antal vanliga p-platser, ej garage), "garageSpaces" (antal garageplatser), och "evSpaces" (antal laddplatser för elbil). Om de inte finns, sätt värdet till 0.
Samt, identifiera ALLA framtida/planerade underhåll och renoveringar, samt ALLA genomförda underhåll från de senaste 5 åren. Ange detta i fältet "maintenance" som en lista (array) av korta strängar, t.ex. "2021: Fasadrenovering" eller "2025 (Planerat): Stambyte". Returnera en tom lista [] om ingen information finns. Sortera listan i fallande ordning så att framtida och de allra senaste underhållen ligger överst. Måste vara exakt och få med allt från perioden.
Samt, sammanfatta de tre viktigaste punkterna förutom nyckeltalen (t.ex. tomträttsavgäld etc.) i en kort text. Lägg detta i fältet "summary".
Formatet måste vara exakt såhär:
{
  "brfName": "Brf Exempel",
  "landOwnership": "Äganderätt",
  "isGenuine": "Äkta",
  "loans": [
    { "year": "2024", "amount": "5 000 000 kr", "interestRate": "1,5 %" }
  ],
  "properties": { "apartments": 54, "rentals": 2, "commercialSpaces": 1, "parkingSpaces": 20, "garageSpaces": 5, "evSpaces": 10 },
  "maintenance": [
    "2020: Fönsterbyte",
    "2025 (Planerat): Takomläggning"
  ],
  "summary": "Kort sammanfattning av de tre viktigaste punkterna här...",
  "years": ["2023", "2022", "2021"],
  "metrics": {
    "skuldsattning": { 
      "2023": { "value": "7 500 kr", "status": "bra" },
      "2022": { "value": "8 200 kr", "status": "mellan" },
      "2021": { "value": "-", "status": "saknas" }
    },
    "sparande": { 
      "2023": { "value": "150 kr", "status": "mellan" },
      "2022": { "value": "110 kr", "status": "daligt" },
      "2021": { "value": "130 kr", "status": "mellan" }
    },
    "rantekanslighet": { 
      "2023": { "value": "4,5 %", "status": "bra" },
      "2022": { "value": "5,2 %", "status": "mellan" },
      "2021": { "value": "4,8 %", "status": "bra" }
    },
    "energikostnad": { 
      "2023": { "value": "250 kr", "status": "daligt" },
      "2022": { "value": "210 kr", "status": "daligt" },
      "2021": { "value": "190 kr", "status": "bra" }
    },
    "arsavgift": { 
      "2023": { "value": "900 kr", "status": "mellan" },
      "2022": { "value": "880 kr", "status": "mellan" },
      "2021": { "value": "850 kr", "status": "mellan" }
    }
  }
}
Använd enbart statusvärdena: "bra", "mellan", "daligt", "saknas". Om ett nyckeltal inte hittas för ett specifikt år, MÅSTE du sätta value till "-" och status till "saknas".`;

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        let model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: systemPrompt,
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        let result;
        try {
            result = await model.generateContent(fileParts);
        } catch (err) {
            if (err.message && (err.message.includes('503') || err.message.includes('high demand'))) {
                console.warn("503 Service Unavailable for gemini-2.5-flash, trying gemini-2.5-pro...");
                model = genAI.getGenerativeModel({ 
                    model: "gemini-2.5-pro",
                    systemInstruction: systemPrompt,
                    generationConfig: {
                        responseMimeType: "application/json"
                    }
                });
                result = await model.generateContent(fileParts);
            } else {
                throw err;
            }
        }

        const text = result.response.text();
        console.log("Raw AI TEXT:", text);
        const cleanJsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        if (!cleanJsonText) {
            throw new Error("AI-modellen returnerade ett tomt svar.");
        }

        let jsonResult;
        try {
            jsonResult = JSON.parse(cleanJsonText);
        } catch (e) {
            console.error("JSON Parse Error. Clean text was:", cleanJsonText);
            throw new Error("AI-modellen returnerade ogiltig JSON: " + e.message);
        }

        if (!jsonResult || typeof jsonResult !== 'object' || Array.isArray(jsonResult)) {
            throw new Error('AI-modellen returnerade ett oväntat resultatformat.');
        }

        const requiredKeys = ['brfName', 'landOwnership', 'isGenuine', 'properties', 'metrics'];
        const missingKeys = requiredKeys.filter((key) => !(key in jsonResult));
        if (missingKeys.length > 0) {
            throw new Error(`AI-resultatet saknar obligatoriska fält: ${missingKeys.join(', ')}`);
        }

        return res.status(200).json(jsonResult);
    } catch (err) {
        console.error("AI Analysis Error:", err);
        return res.status(500).json({ error: 'Något gick fel vid AI-analysen', details: err.message });
    }
}
