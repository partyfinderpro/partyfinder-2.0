const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Usando la llave que vimos que funcionó en el test de conexión anterior
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testWebhook() {
    const webhookUrl = `${SUPABASE_URL}/functions/v1/apify-webhook`;
    const secret = process.env.APIFY_WEBHOOK_SECRET || "venuz-apify-2026";

    console.log(`Testing Webhook URL: ${webhookUrl}`);

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-apify-secret': secret,
                // IMPORTANTE: Supabase Functions requieren este header por defecto
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                items: [
                    {
                        url: "https://www.instagram.com/p/TEST_V2_123",
                        caption: "Prueba de conexión V2 - Antigravity",
                        ownerUsername: "antigravity_v2",
                        displayUrl: "https://via.placeholder.com/150",
                        locationName: "Puerto Vallarta Test V2"
                    }
                ]
            })
        });

        const text = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${text}`);

        if (response.status === 200) {
            console.log("✅ ¡ÉXITO! El Webhook funciona correctamente.");
        } else {
            console.log("❌ Webhook falló.");
        }

    } catch (error) {
        console.error("❌ Network error:", error.message);
    }
}

testWebhook();
