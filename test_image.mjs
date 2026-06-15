import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-flash-latest",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });
        // Tiny 1x1 transparent png
        const imageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        const result = await model.generateContent([
            "What does this image contain? Return a JSON object with a description property.",
            {
                inlineData: {
                    data: imageBase64,
                    mimeType: "image/png"
                }
            }
        ]);
        console.log("Response:", result.response.text());
    } catch (err) {
        console.error("Error:", err.message);
    }
}
run();
