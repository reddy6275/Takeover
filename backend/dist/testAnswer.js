import { generateGroundedAnswer, similaritySearch } from './services/ragService.js';
import dotenv from 'dotenv';
dotenv.config();
async function main() {
    const companyId = '47e5b22b-2e9b-44bb-9426-b81665a31c51'; // Acme Corp
    const companyName = 'Acme Corp';
    const aiTone = 'helpful';
    const query = 'What section handles Refund & Chargeback Policy - Vol 2?';
    try {
        const chunks = await similaritySearch(query, companyId, 4);
        console.log(`Matched ${chunks.length} chunks.`);
        console.log('Generating grounded answer...');
        const result = await generateGroundedAnswer(query, chunks, companyId, companyName, aiTone);
        console.log('Result:');
        console.log(JSON.stringify(result, null, 2));
    }
    catch (err) {
        console.error('Error:', err);
    }
}
main();
