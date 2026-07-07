import { supabase } from './config/supabase.js';
import dotenv from 'dotenv';
dotenv.config();
async function main() {
    console.log('--- Checking Supabase Storage ---');
    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error('Error listing buckets:', error.message);
            return;
        }
        console.log('Current buckets:', buckets.map(b => b.name));
        const hasDocs = buckets.some(b => b.name === 'documents');
        if (!hasDocs) {
            console.log('Creating "documents" bucket...');
            const { data: newBucket, error: createError } = await supabase.storage.createBucket('documents', {
                public: true,
                fileSizeLimit: 10485760, // 10MB
            });
            if (createError) {
                console.error('Failed to create bucket:', createError.message);
            }
            else {
                console.log('Successfully created public "documents" bucket!', newBucket);
            }
        }
        else {
            console.log('"documents" bucket already exists.');
        }
    }
    catch (err) {
        console.error('Thrown error during storage check:', err.message || err);
    }
}
main();
