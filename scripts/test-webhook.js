const { createClient } = require('@supabase/supabase-js');

// Configuración desde .env.local (simulada aquí con lo que leí)
const SUPABASE_URL = "https://jbrmziwosyeructvlvrq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_emVwFBH19Vn54SrEegsWxg_WKU9MaHR"; // Ojo: esta key parece rara en el archivo, normalmente empieza con 'eyJ...', pero usaré lo que vi o pediré al usuario que verifique si falla. 
// REAL CORRECTION: The key in the previous turn output looked like a placeholder or truncated "sb_publishable...". 
// Usually anon keys are JWTs starting with eyJ. 
// However, I will try to use process.env if I can run it with dotenv, or just use fetch for the webhook test which only needs the URL.

// Test Webhook
async function testWebhook() {
    const webhookUrl = `${SUPABASE_URL}/functions/v1/apify-webhook`;
    const secret = "venuz-apify-2026";

    console.log(`Testing Webhook URL: ${webhookUrl}`);

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-apify-secret': secret
            },
            body: JSON.stringify({
                items: [
                    {
                        url: "https://www.instagram.com/p/TEST_POST_123",
                        caption: "Test post from Antigravity diagnostic script",
                        ownerUsername: "antigravity_test",
                        displayUrl: "https://via.placeholder.com/150",
                        locationName: "Puerto Vallarta Test"
                    }
                ]
            })
        });

        const text = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${text}`);

        if (response.status === 200) {
            console.log("✅ Webhook is ACTIVE and reachable!");
        } else {
            console.log("❌ Webhook returned error.");
        }

    } catch (error) {
        console.error("❌ Network error testing webhook:", error.message);
    }
}

testWebhook();
