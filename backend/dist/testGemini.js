import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';
const apiKey = process.env.GEMINI_API_KEY || '';
console.log('GEMINI_API_KEY starts with:', apiKey.substring(0, 10));
console.log('GEMINI_API_KEY length:', apiKey.length);
const ai = new GoogleGenAI({ apiKey });
async function testGemini() {
    try {
        console.log('\nTesting Gemini 2.5 Flash chat...');
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Say "Gemini connected!" in exactly 3 words.'
        });
        console.log('Chat response:', response.text);
    }
    catch (err) {
        console.error('Chat failed:', err.message);
    }
    try {
        console.log('\nTesting gemini-embedding-001 with 768 dims...');
        const response = await ai.models.embedContent({
            model: 'gemini-embedding-001',
            contents: ['Hello world'],
            config: { outputDimensionality: 768 }
        });
        console.log('Embedding length:', response.embeddings?.[0]?.values?.length);
    }
    catch (err) {
        console.error('Embedding failed:', err.message);
    }
}
testGemini();
