require('dotenv').config({ path: '.env.local' });

const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
console.log('Testing generateContent with Key:', key ? key.substring(0, 10) + '...' : 'UNDEFINED');

const model = 'gemini-1.5-pro';
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

const body = {
    contents: [{
        parts: [{
            text: "Hello, are you working?"
        }]
    }]
};

fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
})
    .then(async r => {
        console.log('Status:', r.status);
        const data = await r.json();
        console.log(JSON.stringify(data, null, 2));
    })
    .catch(e => console.error(e));
