import { GoogleGenerativeAI } from '@google/generative-ai';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb', // Vercel Hobby max gräns
    },
  },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Läs JWT från cookie
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.auth_token;

    if (!token) {
        return res.status(401).json({ error: 'Obehörig - logga in först' });
    }

    const JWT_SECRET = process.env.JWT_SECRET;

    try {
        // Validera JWT
        jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return res.status(401).json({ error: 'Ogiltig session' });
    }

    const { pdfBase64 } = req.body;
    
    if (!pdfBase64) {
        return res.status(400).json({ error: 'Ingen PDF skickades med' });
    }

    // En äkta base64-kodad PDF börjar alltid med JVBERi0 (vilket är %PDF-)
    if (!pdfBase64.startsWith('JVBERi0')) {
        return res.status(400).json({ error: 'Ogiltig fil. Detta är inte en äkta PDF.' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    try {

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        
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
Formatet måste vara exakt såhär:
{
  "brfName": "Brf Exempel",
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
            {
                inlineData: {
                    data: pdfBase64,
                    mimeType: "application/pdf"
                }
            }
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
