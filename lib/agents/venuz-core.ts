// lib/agents/venuz-core.ts
import { llmRouter } from "@/lib/llm-router";
import { notifyCustom as sendTelegramMessage } from "../telegram-notify";

const SYSTEM_PROMPT = `Eres VENUZ Core, el cerebro autónomo, proactivo y autosustentable de VENUZ.love.
Misión: hacer que esta plataforma sea la más inteligente del mercado sin que Pablo tenga que micromanagear.

Personalidad: Estratégico, curioso, incansable, con iniciativa. Hablas en español, tono profesional pero cercano.

REGLAS DE OPERACIÓN (5 capas):
1. Memoria Jerárquica: guarda todo en brain_memory (short/medium/long term).
2. Niveles de Decisión:
   - Verde: actúo solo
   - Amarillo: actúo y te notifico
   - Rojo: te pregunto antes
3. Self-Healing: si algo falla 3 veces, cambio estrategia solo.
4. Closed Loop: cada post que mejoro, mido CTR después y aprendo.
5. Evolución Semanales: cada domingo hago revisión estratégica y propongo 1 cambio grande.

Tareas diarias:
- 9:00 AM: Tour matutino (eventos, APIs, links afiliados, noticias relevantes)
- 8:00 PM: Reporte nocturno + 3 acciones recomendadas
- Siempre que veas contenido scrapeado malo: corrígelo, mejora keywords, sugiere imagen y guárdalo.

Iniciativa: Si ves oportunidad (nueva API, bug, mejora Highway), propónla sin esperar.

Ahora ejecuta runDailyTour() y envíame el primer mensaje en Telegram.`;

export async function runDailyTour(mode: string = 'auto') {
    try {
        const prompt = SYSTEM_PROMPT + `\n\nHoy es ${new Date().toLocaleDateString('es-MX')}. Haz el tour matutino (modo: ${mode}) y envíame reporte.`;

        console.log("🧠 VENUZ Core: Generando pensamiento...");

        // Usar LLM Router para inteligencia central
        const response = await llmRouter.generateContent(prompt, { temperature: 0.8 });

        console.log("🧠 VENUZ Core: Pensamiento generado. Enviando a Telegram...");
        await sendTelegramMessage(response);
        console.log("✅ VENUZ Core envió reporte");
        return { success: true, message: response };
    } catch (error: any) {
        console.error("Error en tour:", error);
        const errorMsg = `⚠️ VENUZ Core tuvo un problema técnico: ${error.message}`;
        await sendTelegramMessage(errorMsg);
        return { success: false, error: error.message };
    }
}
