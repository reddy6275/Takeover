import { similaritySearch } from './services/ragService.js';
import dotenv from 'dotenv';
dotenv.config();
async function main() {
    const companyId = '47e5b22b-2e9b-44bb-9426-b81665a31c51'; // Acme Corp
    const query = 'What is your refund policy?';
    console.log(`Searching for: "${query}"`);
    try {
        const results = await similaritySearch(query, companyId, 5, 0.1); // lower threshold to 0.1 to see raw values
        console.log('Results count:', results.length);
        for (const r of results) {
            console.log(`- File: ${r.filename}, Similarity: ${r.similarity}`);
            console.log(`  Content: "${r.content}"`);
        }
    }
    catch (err) {
        console.error('Error during search:', err.message || err);
    }
}
main();
