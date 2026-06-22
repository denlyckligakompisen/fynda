import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
    try {
        console.log("Listing models...");
        // Wait, the SDK might not have listModels, but we can try fetching from REST API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        console.log("Available models:");
        for (const m of data.models) {
            console.log(m.name, m.supportedGenerationMethods);
        }
    } catch (err) {
        console.error("Error:", err);
    }
}
run();
