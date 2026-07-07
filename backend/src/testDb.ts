import { supabase } from './config/supabase.js';

async function testConnection() {
  console.log('Testing Supabase Connection...');
  console.log('URL:', process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  try {
    const { data, error } = await supabase.from('companies').select('id').limit(1);
    if (error) {
      console.error('Error querying companies table:', error);
    } else {
      console.log('Successfully queried companies! Data:', data);
    }
  } catch (err) {
    console.error('Thrown error during query:', err);
  }
}

testConnection();
