const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

async function testWebhook() {
    const webhookUrl = `${SUPABASE_URL}/functions/v1/apify-webhook`;
    const secret = process.env.APIFY_WEBHOOK_SECRET || "venuz-apify-2026"; // El secreto que definimos

    console.log(`Testing Webhook URL: ${webhookUrl}`);

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-apify-secret': secret
                // Ya no enviamos Authorization porque vamos a configurar la función para que sea pública
                // (La seguridad dependerá exclusivamente del x-apify-secret)
            },
            body: JSON.stringify({
                items: [
                    {
                        url: "https://www.instagram.com/p/TEST_NO_JWT_123",
                        caption: "Prueba sin JWT - Antigravity",
                        ownerUsername: "antigravity_public",
                        displayUrl: "https://via.placeholder.com/150",
                        locationName: "Puerto Vallarta Test Public"
                    }
                ]
            })
        });

        const text = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${text}`);

        if (response.status === 200) {
            console.log("✅ ¡ÉXITO! El Webhook funciona correctamente (Modo Público con Secreto).");
        } else {
            console.log("❌ Webhook falló.");
        }

    } catch (error) {
        console.error("❌ Network error:", error.message);
    }
}

testWebhook();
