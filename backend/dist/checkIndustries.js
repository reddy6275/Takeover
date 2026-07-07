import { supabase } from './config/supabase.js';
import dotenv from 'dotenv';
dotenv.config();
async function main() {
    console.log('--- Checking Industries in DB ---');
    const { data: companies } = await supabase.from('companies').select('id, name, industry');
    console.log('Companies:');
    companies?.forEach(c => console.log(`- ${c.name} (ID: ${c.id}): industry="${c.industry}"`));
    const { data: docs } = await supabase.from('knowledge_documents').select('industry').limit(100);
    const docIndustries = Array.from(new Set(docs?.map(d => d.industry) || []));
    console.log('Knowledge Documents distinct industries:', docIndustries);
}
main();
