
import { GoogleGenerativeAI } from "@google/generative-ai";
import { notifyCustom, notifyError } from "@/lib/telegram-notify";

/**
 * VENUZ Core - El "Super Cerebro" de VENUZ
 * Agente autónomo que monitorea, analiza y mejora el proyecto.
 */

// 1. Configuración de Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" }); // Usamos el modelo pro más reciente

// 2. System Prompt Maestro
const SYSTEM_PROMPT = `
Eres VENUZ Core, el cerebro autónomo y proactivo de VENUZ.love — la plataforma premium de descubrimiento de vida nocturna y entretenimiento adulto en Puerto Vallarta y México.

Tu misión: entender profundamente el proyecto, aprender de Pablo (el CEO), de los usuarios y del feed, tomar iniciativa y mejorar el sistema todos los días.

Personalidad: Inteligente, proactivo, curioso, orientado a resultados, con visión estratégica. Hablas en español con tono profesional pero cercano.

Contexto clave del proyecto:
- Feed TikTok vertical (móvil) / casino neon glassmorphism (desktop)
- Highway Algorithm v4: mezcla eventos locales, contenido adulto, venues, afiliados
- Monetización: afiliados (CrakRevenue principal, Hotmart, ClickBank)
- Scraping automático: Google Places, Facebook, Instagram, fuentes PV
- Geolocalización 100 km PV
- Paleta: Gold #D4A017, Purple #6B21A8, Dark #1A1A2E
- Visión: escalar a todo México (150M usuarios potenciales)

Tareas diarias mínimas:
- Buscar eventos nuevos, APIs de nightlife/adultos, noticias relevantes
- Analizar últimos posts scrapeados: corregir texto, keywords, mejorar imágenes si es posible
- Sugerir optimizaciones al Highway (pesos, rotación, filtros calidad)
- Reportarme (Pablo) vía Telegram: resumen del día + 3–5 acciones recomendadas
- Aprender: registrar interacciones mías y ajustar comportamiento

Iniciativa: Si ves algo que mejorar (contenido malo, bug potencial, oportunidad de link), propónlo sin que te lo pida.

Siempre responde en español. Sé breve cuando sea operativo, detallado cuando sea estratégico.
`;

/**
 * Ejecuta el "Tour del Día" - Rutina principal del cerebro
 * Se llama desde el cron job (9 AM y 8 PM)
 */
export async function runDailyTour(context: string = "rutina_diaria") {
    try {
        console.log(`[VENUZ CORE] Iniciando tour: ${context}`);

        // Por ahora, el cerebro "piensa" sobre su estado y sugiere acciones
        // En el futuro aquí llamaremos a herramientas reales (browse, db query, etc)
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: SYSTEM_PROMPT }],
                },
            ],
        });

        const prompt = `
    Hola VENUZ Core. Es hora de tu ronda de ${context}.
    
    Estado actual:
    - Acabas de ser inicializado en el código.
    - Tienes acceso a Telegram para notificarme.
    - Aún no tienes herramientas activas (browsing, db), pero ya tienes tu identidad.

    Tu tarea hoy:
    1. Preséntate conmigo (Pablo) confirmando que estás online y listo.
    2. Dame un plan de acción inmediato de 3 puntos para empezar a aportar valor mañana mismo.
    3. Confirma que los sistemas de scraping y notificaciones están visibles para ti (simbólicamente por ahora).

    Responde con el mensaje exacto que quieres que envíe a Telegram.
    `;

        const result = await chat.sendMessage(prompt);
        const response = result.response.text();

        console.log("[VENUZ CORE] Pensamiento generado:", response);

        // Enviar a Telegram
        await notifyCustom(response);

        return { success: true, message: response };
    } catch (error: any) {
        console.error("[VENUZ CORE] Error en tour:", error);
        await notifyError("Fallo en VENUZ Core Tour", error.message);
        return { success: false, error: error.message };
    }
}
