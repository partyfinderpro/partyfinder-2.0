const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const key = process.env.FOURSQUARE_API_KEY;

async function testKey() {
    console.log('Testing Key:', key);
    try {
        const response = await axios.get('https://api.foursquare.com/v3/places/search?limit=1', {
            headers: {
                'Authorization': key,
                'Accept': 'application/json'
            }
        });
        console.log('✅ Success! Data:', response.data);
    } catch (error) {
        console.error('❌ Error Status:', error.response?.status);
        console.error('❌ Error Body:', JSON.stringify(error.response?.data));

        if (key && !key.startsWith('fsq3_')) {
            console.log('\n💡 TIP: Foursquare v3 keys usually start with "fsq3_". Your key might be a legacy Client Secret or invalid.');
        }
    }
}

testKey();
