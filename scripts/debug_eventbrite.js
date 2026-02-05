
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function debugEventbrite() {
    const token = process.env.EVENTBRITE_PRIVATE_TOKEN;
    console.log("🔑 Probando Token:", token ? "Token presente" : "Token FALTA");

    // 1. Probar Whoami (Auth Check)
    try {
        const res = await fetch('https://www.eventbriteapi.com/v3/users/me/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (res.ok) {
            console.log("✅ Auth OK. Usuario:", data.name || data.emails[0].email);
        } else {
            console.error("❌ Auth Falló:", data);
            return;
        }
    } catch (e) {
        console.error("❌ Error conectando a Eventbrite:", e.message);
        return;
    }

    // 2. Probar Organizations (Necesario para listar eventos si search está cerrado)
    try {
        const res = await fetch('https://www.eventbriteapi.com/v3/users/me/organizations/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        console.log("🏢 Organizaciones encontradas:", data.organizations?.length || 0);
        if (data.organizations?.length > 0) {
            console.log("   Org ID:", data.organizations[0].id);
        }
    } catch (e) {
        console.error("❌ Error Organizations:", e.message);
    }

    // 3. Probar Search Alternativo (Si el endpoint viejo falla)
    // El endpoint /events/search/ fue eliminado el 1 de Diciembre de 2019 para nuevas apps.
    // Solo está disponible para partners selectos.
    console.log("⚠️ /events/search/ está probablemente deprecado.");
}

debugEventbrite();
