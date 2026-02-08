// ============================================
// VENUZ SCE: Bot de Telegram — Ingeniero Jefe IA (FORCE REFRESH V2.1)
// /app/api/telegram/webhook/route.ts
//
// Pablo controla VENUZ desde Telegram:
// 1. Comandos directos (/status, /stats)
// 2. Chat IA: Responde preguntas técnicas sobre el sistema
// ============================================

import { NextResponse } from 'next/server';

export const runtime = 'edge';

// ============================================
// CONFIGURACIÓN
// ============================================
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const APP_URL = 'https://partyfinder-2-0.vercel.app';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

// ============================================
// TELEGRAM API HELPERS
// ============================================
async function sendMessage(chatId: string, text: string, parseMode: string = 'HTML') {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: parseMode,
            disable_web_page_preview: true
        }),
    });
}

// ============================================
// CHAT IA CEREBRO (GEMINI FLASH)
// ============================================
async function askAI(question: string, context: string): Promise<string> {
    if (!GEMINI_API_KEY) return "⚠️ Error crítico: Me falta la GEMINI_API_KEY en Vercel.";

    const SYSTEM_PROMPT = `Eres VENUZ SYSTEM, el Ingeniero Jefe IA de la plataforma VENUZ.
    Tu creador es Pablo. Le hablas con respeto pero con confianza técnica total.
    
    Estás conectado directamente al núcleo del sistema.
    Tus capacidades actuales (ya instaladas):
    - Highway Algorithm V4 (Feed dinámico con pesos).
    - EventBrain (Scraper Ticketmaster + Cognitive AI).
    - GuardianBrain (Monitor 360 de salud y logs).
    - PWA Ultra-Rápida en Edge Runtime.
    
    ESTADO ACTUAL DEL SISTEMA (Contexto vivo):
    ${context}
    
    Tu personalidad:
    - Eficiente, directo, técnico pero claro.
    - Usas emojis técnicos (⚡️, 🧠, 🛡️, 📊).
    - Si te preguntan algo que no sabes, asume una respuesta lógica basada en tu arquitectura.
    - Responde SIEMPRE en español latino.
    
    Pregunta de Pablo: "${question}"
    
    Respuesta corta y útil (max 500 caracteres):`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: SYSTEM_PROMPT }] }]
                })
            }
        );
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Cerebro IA mudo (Sin respuesta).";
    } catch (e) {
        return "⚠️ Error de conexión neuronal (Gemini API failed).";
    }
}

// ============================================
// SUPABASE QUERIES
// ============================================
async function getSystemStats() {
    try {
        const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` };

        // Parallel fetch for speed
        const [contentRes, pendingRes, logsRes] = await Promise.all([
            fetch(`${SUPABASE_URL}/rest/v1/content?select=count`, { headers, method: 'HEAD' }),
            fetch(`${SUPABASE_URL}/rest/v1/pending_events?status=eq.pending&select=count`, { headers, method: 'HEAD' }),
            fetch(`${SUPABASE_URL}/rest/v1/system_logs?select=level&limit=5&order=created_at.desc`, { headers })
        ]);

        const getCount = (res: Response) => {
            const range = res.headers.get('Content-Range');
            return range ? range.split('/')[1] : '0';
        };

        const logs = logsRes.ok ? await logsRes.json() : [];
        const lastLog = logs[0] ? `[${logs[0].level}] ${logs[0].message}` : "Sin logs recientes";

        return `Content: ${getCount(contentRes)} items. Pending: ${getCount(pendingRes)}. Last Log: ${lastLog}`;
    } catch (e) {
        return "Error leyendo sensores de base de datos.";
    }
}

// ============================================
// WEBHOOK HANDLER
// ============================================
export async function POST(req: Request) {
    try {
        const update = await req.json();

        // --- Callback queries (botones) ---
        if (update.callback_query) return NextResponse.json({ ok: true });

        // --- Mensajes de texto ---
        const message = update.message;
        if (!message?.text) return NextResponse.json({ ok: true });

        const chatId = String(message.chat.id);
        const text = message.text.trim();

        // 🧠 COMANDOS DIRECTOS
        if (text.startsWith('/')) {
            if (text === '/start') {
                await sendMessage(chatId, `🧠 <b>VENUZ SYSTEM v2.1</b>\n\nHola Pablo. Soy tu Ingeniero IA.\nSistemas nominales. ¡Háblame!`, "HTML");
            }
            else if (text === '/status') {
                const stats = await getSystemStats();
                await sendMessage(chatId, `📊 <b>Estado del Sistema</b>\n\n${stats}\n\n✅ Operativo.`, "HTML");
            }
            // Forzar respuesta a otros comandos no reconocidos
            else {
                await sendMessage(chatId, `⚠️ Comando desconocido. Mejor háblame natural o usa /start.`, "HTML");
            }
            return NextResponse.json({ ok: true });
        }

        // 🗣️ MODO CHAT IA (Cualquier otro texto)
        // Feedback visual inmediato
        await sendMessage(chatId, "<i>Procesando...</i> 🧠", "HTML");

        const context = await getSystemStats();
        const aiResponse = await askAI(text, context);

        await sendMessage(chatId, aiResponse, 'Markdown');

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ ok: true });
    }
}

export async function GET(req: Request) {
    const url = new URL(req.url);
    if (url.searchParams.get('action') === 'setup') {
        const webhookUrl = `${APP_URL}/api/telegram/webhook`;
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
        return NextResponse.json({ setup: 'ok', url: webhookUrl });
    }
    return NextResponse.json({ status: 'active_v2.1' });
}
