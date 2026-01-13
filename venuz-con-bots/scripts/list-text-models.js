require('dotenv').config({ path: '.env.local' });

const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
console.log('🔑 Testing with Key:', key ? key.substring(0, 10) + '...' : 'UNDEFINED');

// Get all models and filter for generateContent support
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
    .then(async r => {
        const data = await r.json();
        if (data.models) {
            const textModels = data.models.filter(m =>
                m.supportedGenerationMethods &&
                m.supportedGenerationMethods.includes('generateContent')
            );
            console.log('\n📋 Modelos que soportan generateContent:\n');
            textModels.forEach(m => {
                console.log(`  ✅ ${m.name}`);
                console.log(`     Display: ${m.displayName}`);
                console.log('');
            });
        } else {
            console.log('Error:', data);
        }
    })
    .catch(e => console.error(e));
