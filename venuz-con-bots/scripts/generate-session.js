
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input"); // npm install input

// Fill these with your own details OR leave empty to input via console
const apiId = process.env.TELEGRAM_API_ID ? parseInt(process.env.TELEGRAM_API_ID) : null;
const apiHash = process.env.TELEGRAM_API_HASH;
const stringSession = new StringSession(""); // Empty string for new session

(async () => {
    console.log("🚀 Iniciando Generador de Sesión de Telegram...");

    if (!apiId || !apiHash) {
        console.log("⚠️  No encontré TELEGRAM_API_ID o TELEGRAM_API_HASH en el archivo .env");
        console.log("   Tendrás que introducirlos manualmente ahora.");
    }

    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });

    await client.start({
        phoneNumber: async () => await input.text("📱 Tu número de teléfono (con código +): "),
        password: async () => await input.text("🔒 Tu contraseña (si tienes 2FA, si no deja vacío): "),
        phoneCode: async () => await input.text("📩 El código que te llegó a Telegram: "),
        onError: (err) => console.log(err),
    });

    console.log("\n✅ ¡Conectado con éxito!");
    console.log("👇 COPIA ESTE CÓDIGO (SESSION STRING) 👇");
    console.log("\n" + client.session.save() + "\n");
    console.log("👆 Pégalo en GitHub Secrets como TELEGRAM_SESSION");

    // Send a message to saved messages to confirm
    await client.sendMessage("me", { message: "Hola! Esta es mi nueva sesión para VENUZ Bot 🤖" });
    console.log("✅ Te he enviado un mensaje a 'Mensajes Guardados' para confirmar.");

    process.exit(0);
})();
