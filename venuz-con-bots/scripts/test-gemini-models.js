require('dotenv').config({ path: '.env.local' });

const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
console.log('🔑 Testing with Key:', key ? key.substring(0, 10) + '...' : 'UNDEFINED');

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
    .then(async r => {
        console.log('Status:', r.status);
        const data = await r.json();
        console.log(JSON.stringify(data, null, 2));
    })
    .catch(e => console.error(e));
