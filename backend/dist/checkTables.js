import { supabase } from './config/supabase.js';
import dotenv from 'dotenv';
dotenv.config();
async function main() {
    const tables = [
        'companies',
        'users',
        'knowledge_documents',
        'document_chunks',
        'conversations',
        'messages',
        'tickets',
        'analytics_events'
    ];
    console.log('--- Database Row Counts ---');
    for (const table of tables) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            if (error) {
                console.error(`Error checking table "${table}":`, error.message);
            }
            else {
                console.log(`Table "${table}": ${count} rows`);
            }
        }
        catch (err) {
            console.error(`Thrown error on table "${table}":`, err.message || err);
        }
    }
}
main();
