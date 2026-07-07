import dotenv from 'dotenv';
dotenv.config();
async function checkSpec() {
    const url = 'https://api.supabase.com/v1/projects';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('Fetching projects from:', url);
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${key}`
            }
        });
        if (!response.ok) {
            console.error('HTTP Error:', response.status, response.statusText);
            const text = await response.text();
            console.error('Body:', text);
            return;
        }
        const data = await response.json();
        console.log('Projects:', data);
    }
    catch (err) {
        console.error('Fetch failed:', err);
    }
}
checkSpec();
