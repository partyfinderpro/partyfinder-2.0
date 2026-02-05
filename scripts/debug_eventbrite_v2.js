
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

async function debugEventbrite() {
    const token = process.env.EVENTBRITE_PRIVATE_TOKEN;

    // Si no lee EVENTBRITE_PRIVATE_TOKEN, intenta con EVENTBRITE_API_KEY
    // A veces la confusión viene de qué variable se guarda
    const authHeader = { 'Authorization': `Bearer ${token}` };

    console.log("🔑 Probando Auth...");

    try {
        // 1. Whoami
        const res = await axios.get('https://www.eventbriteapi.com/v3/users/me/', { headers: authHeader });
        console.log("✅ Auth OK. Usuario:", res.data.name || res.data.emails[0]?.email);

        // 2. Search check
        // Oficialmente /events/search/ retorna 404 si no tienes acceso
        try {
            console.log("\n🔍 Probando endpoint /events/search/...");
            await axios.get('https://www.eventbriteapi.com/v3/events/search/?location.address=Mexico&location.within=10km', { headers: authHeader });
            console.log("✅ Endpoint search FUNCIONA!");
        } catch (searchErr) {
            console.error("❌ Endpoint search FALLÓ:", searchErr.response?.status, searchErr.response?.statusText);
            console.log("ℹ️ Razón: Eventbrite eliminó el acceso público a Search API en 2019.");
        }

    } catch (e) {
        console.error("❌ Auth Falló:", e.response?.data || e.message);
    }
}

debugEventbrite();
