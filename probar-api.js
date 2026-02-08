const https = require('https');

const API_KEY = 'AIzaSyDqfOqG7J6KDlJgb1L7S-oo3ix29sPBsLc';
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const data = JSON.stringify({
    contents: [{ parts: [{ text: "Si funcionas responde: 'SI, ESTOY VIVA Y LISTA PARA TRABAJAR'" }] }]
});

const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
    },
};

console.log("⏳ Probando tu API Key con Google Gemini...");

const req = https.request(url, options, (res) => {
    let responseBody = '';

    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            try {
                const parsed = JSON.parse(responseBody);
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                console.log("\n✅ ¡ÉXITO! La API Key funciona perfectamente.");
                console.log("🤖 Gemini dice:", text);
            } catch (e) {
                console.log("✅ Conexión exitosa, pero respuesta inesperada:", responseBody);
            }
        } else {
            console.log("\n❌ ERROR. La API Key tiene un problema.");
            console.log("Código de estado:", res.statusCode);
            console.log("Detalle:", responseBody);
        }
    });
});

req.on('error', (error) => {
    console.error("❌ Error de conexión (revisa tu internet):", error);
});

req.write(data);
req.end();
