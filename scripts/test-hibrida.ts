
import { runHibridaTour } from '../lib/venuz-hibrida/hibrida-graph';
import * as dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

async function test() {
    console.log("🧪 Iniciando prueba de Cerebro Híbrido...");
    if (!process.env.GROQ_API_KEY) {
        console.error("❌ Faltan llaves de entorno (GROQ_API_KEY). Asegúrate de tener .env.local configurado.");
        return;
    }

    try {
        const input = "Dime qué hora es y recomiéndame un bar en CDMX.";
        console.log(`🗣️ Input: "${input}"`);

        const start = Date.now();
        const result = await runHibridaTour(input);
        const duration = Date.now() - start;

        console.log(`⏱️ Tiempo de respuesta: ${duration}ms`);
        console.log("🤖 Respuesta del Agente:");
        console.log("---------------------------------------------------");
        console.log(result.output);
        console.log("---------------------------------------------------");

        if (result.output && result.output.length > 10) {
            console.log("✅ PRUEBA EXITOSA: El agente generó respuesta.");
        } else {
            console.error("❌ PRUEBA FALLIDA: Respuesta vacía o muy corta.");
        }
    } catch (error) {
        console.error("❌ ERROR FATAL:", error);
    }
}

test();
