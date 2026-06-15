import { GoogleGenerativeAI } from '@google/generative-ai';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

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
        const email = data.users?.[0]?.email;

        if (email !== 'frebrandberg@gmail.com') {
            return res.status(403).json({ error: 'Åtkomst nekad - fel konto' });
        }
    } catch (err) {
        console.error('Token verification error:', err);
        return res.status(500).json({ error: 'Serverfel vid verifiering' });
    }

    const { pdfBase64, files } = req.body;
    
    let fileParts = [];

    if (pdfBase64) {
        if (!pdfBase64.startsWith('JVBERi0')) {
            return res.status(400).json({ error: 'Ogiltig fil. Detta är inte en äkta PDF.' });
        }
        fileParts.push({
            inlineData: {
                data: pdfBase64,
                mimeType: "application/pdf"
            }
        });
    } else if (files && Array.isArray(files) && files.length > 0) {
        fileParts = files.map(f => ({
            inlineData: {
                data: f.data,
                mimeType: f.mimeType
            }
        }));
    } else {
        return res.status(400).json({ error: 'Inga filer skickades med' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    try {

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });
        
        const prompt = `Du är en expert på att analysera svenska årsredovisningar för bostadsrättsföreningar.
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
Samt, sammanfatta de tre viktigaste punkterna förutom nyckeltalen (t.ex. kommande stora renoveringar, tomträttsavgäld, lån som förfaller etc.) i en kort text. Lägg detta i fältet "summary".
Formatet måste vara exakt såhär:
{
  "brfName": "Brf Exempel",
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

        const result = await model.generateContent([
            prompt,
            ...fileParts
        ]);

        const text = result.response.text();
        const cleanJsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonResult = JSON.parse(cleanJsonText);

        return res.status(200).json(jsonResult);
    } catch (err) {
        console.error("AI Analysis Error:", err);
        return res.status(500).json({ error: 'Något gick fel vid AI-analysen', details: err.message });
    }
}
