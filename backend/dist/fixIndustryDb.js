import { supabase } from './config/supabase.js';
import dotenv from 'dotenv';
dotenv.config();
async function main() {
    console.log('Updating "Customer support" to "Customer Support" in Supabase database...');
    try {
        const { data, error } = await supabase
            .from('knowledge_documents')
            .update({ industry: 'Customer Support' })
            .eq('industry', 'Customer support')
            .select('id');
        if (error) {
            console.error('Error updating industries:', error.message);
        }
        else {
            console.log(`Successfully updated ${data?.length || 0} documents in Supabase!`);
        }
    }
    catch (err) {
        console.error('Exception during update:', err.message || err);
    }
}
main();
