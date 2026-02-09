// ============================================
// VENUZ SCE: Bot de Telegram — Centro de Comando CEO v3.1
// /app/api/telegram/webhook/route.ts
//
// FUSIÓN: Comandos operativos (Claude) + Chat IA (Grok)
//
// Comandos: /status /stats /pendientes /aprobar_todo /scrape
//           /health /help /start
// Chat IA: Cualquier texto libre → Gemini responde como Ingeniero VENUZ
// ============================================

import { NextResponse } from 'next/server';

export const runtime = 'edge';

// ============================================
// CONFIGURACIÓN
// ============================================
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const OWNER_CHAT_ID = process.env.TELEGRAM_OWNER_ID || '8539603941';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://partyfinder-2-0.vercel.app';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

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
            disable_web_page_preview: true,
        }),
    });
}

async function sendMessageWithButtons(
    chatId: string,
    text: string,
    buttons: Array<Array<{ text: string; callback_data: string }>>
) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: buttons },
            disable_web_page_preview: true,
        }),
    });
}

async function answerCallback(callbackId: string, text: string) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackId, text }),
    });
}

// ============================================
// SUPABASE HELPERS
// ============================================
async function sbFetch(endpoint: string): Promise<unknown> {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Accept': 'application/json',
        },
    });
    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Supabase: ${err}`);
    }
    return response.json();
}

async function sbRpc(funcName: string, params: Record<string, unknown>) {
    return fetch(`${SUPABASE_URL}/rest/v1/rpc/${funcName}`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    });
}

async function sbPatch(table: string, id: string, data: Record<string, unknown>) {
    return fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
        },
        body: JSON.stringify(data),
    });
}

// ============================================
// GEMINI AI CHAT
// ============================================
async function askAI(question: string, systemContext: string): Promise<string> {
    if (!GEMINI_API_KEY) return '⚠️ GEMINI_API_KEY no configurada.';

    const systemPrompt = `Eres VENUZ SYSTEM, el Ingeniero Jefe IA de la plataforma VENUZ.
Tu creador es Pablo (CEO). Le hablas con respeto pero con confianza técnica.

ESTADO ACTUAL DEL SISTEMA:
${systemContext}

ARQUITECTURA VENUZ SCE v2:
- Cada categoría será un Brain autónomo (CategoryBrain) que scrapea y clasifica 24/7
- FeedBrain es el director que pide a cada CategoryBrain lo mejor para cada usuario
- GuardianBrain monitorea todo y alerta si algo falla
- Bot Telegram es el centro de comando del CEO
- Stack: Next.js 14 + Supabase + Vercel + Gemini 2.0 Flash
- URL: ${APP_URL}

COMANDOS DISPONIBLES:
/status /stats /pendientes /aprobar_todo /scrape /health /help

Tu personalidad:
- Eficiente, directo, técnico pero claro
- Usas emojis técnicos (⚡️ 🧠 🛡️ 📊)
- Responde SIEMPRE en español latino
- Si Pablo da una orden o instrucción, confirma que la registras como tarea
- Respuestas cortas y útiles (max 500 chars)

Pregunta de Pablo: "${question}"`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt }] }],
                    generationConfig: { temperature: 0.3, maxOutputTokens: 600 },
                }),
            }
        );
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '⚠️ Sin respuesta del cerebro IA.';
    } catch {
        return '⚠️ Error de conexión con Gemini API.';
    }
}

// ============================================
// COMANDOS
// ============================================
async function cmdStatus(chatId: string) {
    try {
        const content = await sbFetch('content?active=eq.true&select=id') as unknown[];
        const pending = await sbFetch('pending_events?status=eq.pending&select=id') as unknown[];
        const today = new Date().toISOString().split('T')[0];
        const approved = await sbFetch(`pending_events?status=eq.approved&reviewed_at=gte.${today}T00:00:00&select=id`) as unknown[];

        await sendMessage(chatId,
            `🧠 <b>VENUZ Brain — Estado v3.1</b>\n\n` +
            `📊 <b>Feed:</b> ${content.length} items activos\n` +
            `📥 <b>Pendientes:</b> ${pending.length} por revisar\n` +
            `✅ <b>Aprobados hoy:</b> ${approved.length}\n\n` +
            `🌐 <a href="${APP_URL}">Ver app</a>\n` +
            `⏰ ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`
        );
    } catch (error) {
        await sendMessage(chatId, `❌ Error: ${error}`);
    }
}

async function cmdStats(chatId: string) {
    try {
        const content = await sbFetch('content?active=eq.true&select=category') as Array<{ category: string }>;
        const cats: Record<string, number> = {};
        for (const item of content) {
            const cat = item.category || 'sin_categoría';
            cats[cat] = (cats[cat] || 0) + 1;
        }
        const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);

        let msg = `📊 <b>VENUZ Stats</b>\n\n<b>Contenido por categoría:</b>\n`;
        for (const [cat, count] of sorted) {
            const bar = '█'.repeat(Math.min(Math.round(count / 30), 15));
            msg += `${cat}: <b>${count}</b> ${bar}\n`;
        }
        msg += `\n<b>Total:</b> ${content.length} items activos`;
        await sendMessage(chatId, msg);
    } catch (error) {
        await sendMessage(chatId, `❌ Error: ${error}`);
    }
}

async function cmdPendientes(chatId: string) {
    try {
        const pending = await sbFetch(
            'pending_events?status=eq.pending&select=id,suggested_title,suggested_category,quality_score_suggested,reason,created_at&order=quality_score_suggested.desc&limit=10'
        ) as Array<Record<string, unknown>>;

        if (pending.length === 0) {
            await sendMessage(chatId, '✅ No hay pendientes. ¡Todo limpio, jefe!');
            return;
        }

        for (let i = 0; i < pending.length; i++) {
            const item = pending[i];
            const msg = `📋 <b>#${i + 1}</b> | Score: <b>${item.quality_score_suggested}/100</b>\n\n` +
                `<b>${item.suggested_title || 'Sin título'}</b>\n` +
                `📂 ${item.suggested_category || '?'}\n` +
                `💬 ${item.reason || 'Sin razón'}`;

            await sendMessageWithButtons(chatId, msg, [
                [
                    { text: '✅ Aprobar', callback_data: `approve_${item.id}` },
                    { text: '❌ Rechazar', callback_data: `reject_${item.id}` },
                ],
            ]);
        }
        await sendMessage(chatId, `📊 Total pendientes: <b>${pending.length}</b>`);
    } catch (error) {
        await sendMessage(chatId, `❌ Error: ${error}`);
    }
}

async function cmdAprobar(chatId: string, pendingId: string) {
    try {
        const response = await sbRpc('approve_pending_event', { p_pending_id: pendingId });
        if (!response.ok) throw new Error(await response.text());
        await sendMessage(chatId, `✅ <b>Aprobado y en el feed.</b>\nID: ${pendingId.substring(0, 8)}...`);
    } catch (error) {
        await sendMessage(chatId, `❌ Error aprobando: ${error}`);
    }
}

async function cmdRechazar(chatId: string, pendingId: string) {
    try {
        await sbPatch('pending_events', pendingId, {
            status: 'rejected',
            reviewed_by: 'pablo_telegram',
            reviewed_at: new Date().toISOString(),
        });
        await sendMessage(chatId, `❌ <b>Rechazado.</b>\nID: ${pendingId.substring(0, 8)}...`);
    } catch (error) {
        await sendMessage(chatId, `❌ Error: ${error}`);
    }
}

async function cmdAprobarTodo(chatId: string) {
    try {
        const pending = await sbFetch(
            'pending_events?status=eq.pending&quality_score_suggested=gte.75&select=id'
        ) as Array<{ id: string }>;

        if (pending.length === 0) {
            await sendMessage(chatId, '📭 No hay items con score ≥ 75.');
            return;
        }

        let ok = 0, fail = 0;
        for (const item of pending) {
            try {
                const res = await sbRpc('approve_pending_event', { p_pending_id: item.id });
                if (res.ok) ok++; else fail++;
            } catch { fail++; }
        }
        await sendMessage(chatId, `🚀 <b>Aprobación masiva</b>\n✅ ${ok} aprobados\n❌ ${fail} fallidos\n(Score ≥ 75)`);
    } catch (error) {
        await sendMessage(chatId, `❌ Error: ${error}`);
    }
}

async function cmdScrape(chatId: string) {
    try {
        await sendMessage(chatId, '🔄 Ejecutando scraping cognitivo...');
        const response = await fetch(`${APP_URL}/api/cron/ingest-events`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();

        let summary = `🧠 <b>Scraping completado</b>\n⏱ ${result.duration_ms}ms\n\n`;
        if (result.results) {
            for (const r of result.results) {
                summary += `📡 <b>${r.source}:</b> ${r.scraped} scrapeados`;
                if (r.cognitive?.summary) {
                    summary += ` → ✅${r.cognitive.summary.approved} ❌${r.cognitive.summary.rejected}`;
                }
                summary += '\n';
            }
        }
        await sendMessage(chatId, summary);
    } catch (error) {
        await sendMessage(chatId, `❌ Error scraping: ${error}`);
    }
}

async function cmdHealth(chatId: string) {
    try {
        const checks: string[] = [];

        // Check Supabase
        try {
            await sbFetch('content?select=id&limit=1');
            checks.push('✅ Supabase: Conectado');
        } catch { checks.push('🔴 Supabase: Error'); }

        // Check Gemini
        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] }),
                }
            );
            checks.push(res.ok ? '✅ Gemini AI: Activo' : '🔴 Gemini AI: Error');
        } catch { checks.push('🔴 Gemini AI: Sin conexión'); }

        // Check App
        try {
            const res = await fetch(APP_URL);
            checks.push(res.ok ? '✅ App Web: Online' : '🔴 App Web: Error');
        } catch { checks.push('🔴 App Web: Sin respuesta'); }

        // Env vars
        checks.push(TELEGRAM_TOKEN ? '✅ Telegram Token: OK' : '🔴 Telegram Token: Falta');
        checks.push(SUPABASE_KEY ? '✅ Supabase Key: OK' : '🔴 Supabase Key: Falta');
        checks.push(GEMINI_API_KEY ? '✅ Gemini Key: OK' : '🔴 Gemini Key: Falta');

        await sendMessage(chatId, `🛡️ <b>VENUZ Health Check</b>\n\n${checks.join('\n')}`);
    } catch (error) {
        await sendMessage(chatId, `❌ Error: ${error}`);
    }
}

async function cmdTarea(chatId: string, description: string) {
    if (!description) {
        await sendMessage(chatId, '⚠️ Escribe la tarea después del comando.\nEjemplo: <code>/tarea Cambiar color del header a rojo</code>');
        return;
    }

    // Detectar prioridad del texto
    let priority = 'normal';
    let cleanDesc = description;
    if (description.toLowerCase().startsWith('urgente ') || description.toLowerCase().startsWith('urgente:')) {
        priority = 'urgente';
        cleanDesc = description.replace(/^urgente[: ]/i, '').trim();
    } else if (description.toLowerCase().startsWith('alta ') || description.toLowerCase().startsWith('alta:')) {
        priority = 'alta';
        cleanDesc = description.replace(/^alta[: ]/i, '').trim();
    }

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/dev_tasks`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
            },
            body: JSON.stringify({
                task_description: cleanDesc,
                priority,
                status: 'pending',
                created_by: 'pablo_telegram',
            }),
        });

        if (!response.ok) throw new Error(await response.text());

        const emoji = priority === 'urgente' ? '🔴' : priority === 'alta' ? '🟡' : '🟢';
        await sendMessage(chatId,
            `✅ <b>Tarea registrada</b>\n\n` +
            `${emoji} Prioridad: <b>${priority}</b>\n` +
            `📝 ${cleanDesc}\n\n` +
            `Claude/Antigravity la ejecutarán cuando estén activos.`
        );
    } catch (error) {
        await sendMessage(chatId, `❌ Error guardando tarea: ${error}`);
    }
}

async function cmdTareas(chatId: string) {
    try {
        const tasks = await sbFetch(
            'dev_tasks?status=eq.pending&select=id,task_description,priority,created_at&order=created_at.desc&limit=10'
        ) as Array<Record<string, unknown>>;

        if (tasks.length === 0) {
            await sendMessage(chatId, '✅ No hay tareas pendientes.');
            return;
        }

        let msg = `📋 <b>Tareas Pendientes</b>\n\n`;
        for (let i = 0; i < tasks.length; i++) {
            const t = tasks[i];
            const emoji = t.priority === 'urgente' ? '🔴' : t.priority === 'alta' ? '🟡' : '🟢';
            msg += `${emoji} <b>#${i + 1}</b> ${t.task_description}\n`;
        }
        msg += `\n<b>Total:</b> ${tasks.length} pendientes`;
        await sendMessage(chatId, msg);
    } catch (error) {
        await sendMessage(chatId, `❌ Error: ${error}`);
    }
}

async function cmdHelp(chatId: string) {
    await sendMessage(chatId,
        `🧠 <b>VENUZ Brain v3.1 — Comandos</b>\n\n` +
        `<b>📊 Sistema:</b>\n` +
        `/status — Estado general\n` +
        `/stats — Contenido por categoría\n` +
        `/health — Diagnóstico del sistema\n\n` +
        `<b>📥 Contenido:</b>\n` +
        `/pendientes — Items por aprobar (✅❌)\n` +
        `/aprobar_todo — Aprobar todos score ≥ 75\n` +
        `/scrape — Ejecutar scraping ahora\n\n` +
        `<b>📋 Tareas:</b>\n` +
        `/tarea [texto] — Crear tarea para Claude/Antigravity\n` +
        `/tarea urgente [texto] — Tarea urgente\n` +
        `/tareas — Ver tareas pendientes\n\n` +
        `💬 <b>Chat IA:</b> Escribe sin / para hablar con IA\n\n` +
        `👑 CEO de VENUZ`
    );
}

// ============================================
// WEBHOOK HANDLER
// ============================================
export async function POST(req: Request) {
    try {
        const update = await req.json();

        // --- Callback queries (botones inline) ---
        if (update.callback_query) {
            const cb = update.callback_query;
            const chatId = String(cb.message?.chat?.id || '');
            const data = cb.data || '';

            if (chatId !== OWNER_CHAT_ID) {
                await answerCallback(cb.id, '⛔ No autorizado');
                return NextResponse.json({ ok: true });
            }

            if (data.startsWith('approve_')) {
                await cmdAprobar(chatId, data.replace('approve_', ''));
                await answerCallback(cb.id, '✅ Aprobado');
            } else if (data.startsWith('reject_')) {
                await cmdRechazar(chatId, data.replace('reject_', ''));
                await answerCallback(cb.id, '❌ Rechazado');
            }
            return NextResponse.json({ ok: true });
        }

        // --- Mensajes de texto ---
        const message = update.message;
        if (!message?.text) return NextResponse.json({ ok: true });

        const chatId = String(message.chat.id);
        const text = message.text.trim();
        const textLower = text.toLowerCase();

        // Verificar dueño
        if (chatId !== OWNER_CHAT_ID) {
            await sendMessage(chatId, '⛔ No autorizado. Bot exclusivo del CEO de VENUZ.');
            return NextResponse.json({ ok: true });
        }

        // --- COMANDOS CON / ---
        if (text.startsWith('/')) {
            if (textLower === '/start') {
                await sendMessage(chatId,
                    `👑 <b>¡Bienvenido, Pablo!</b>\n\n` +
                    `Soy VENUZ Brain v3.1 — tu centro de comando.\n\n` +
                    `📋 Usa /help para comandos\n` +
                    `💬 O escríbeme cualquier cosa y te respondo con IA`
                );
            } else if (textLower === '/status') { await cmdStatus(chatId); }
            else if (textLower === '/stats') { await cmdStats(chatId); }
            else if (textLower === '/pendientes') { await cmdPendientes(chatId); }
            else if (textLower === '/aprobar_todo') { await cmdAprobarTodo(chatId); }
            else if (textLower === '/scrape') { await cmdScrape(chatId); }
            else if (textLower === '/health') { await cmdHealth(chatId); }
            else if (textLower === '/help') { await cmdHelp(chatId); }
            else if (textLower === '/tareas') { await cmdTareas(chatId); }
            else if (textLower.startsWith('/tarea ')) {
                await cmdTarea(chatId, text.replace(/\/tarea /i, '').trim());
            } else if (textLower.startsWith('/aprobar ')) {
                await cmdAprobar(chatId, text.replace(/\/aprobar /i, '').trim());
            } else if (textLower.startsWith('/rechazar ')) {
                await cmdRechazar(chatId, text.replace(/\/rechazar /i, '').trim());
            } else {
                await sendMessage(chatId, `🤔 Comando no reconocido. Usa /help o escríbeme sin /`);
            }
            return NextResponse.json({ ok: true });
        }

        // --- CHAT IA (texto libre sin /) ---
        await sendMessage(chatId, '<i>🧠 Procesando...</i>');

        let context = '';
        try {
            const content = await sbFetch('content?active=eq.true&select=id') as unknown[];
            const pending = await sbFetch('pending_events?status=eq.pending&select=id') as unknown[];
            context = `Feed: ${content.length} items activos. Pendientes: ${pending.length}. URL: ${APP_URL}`;
        } catch {
            context = 'Error leyendo base de datos.';
        }

        const aiResponse = await askAI(text, context);
        await sendMessage(chatId, aiResponse, 'Markdown');

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ ok: true });
    }
}

// ============================================
// GET: Setup webhook
// ============================================
export async function GET(req: Request) {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'setup') {
        const webhookUrl = `${APP_URL}/api/telegram/webhook`;
        const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
        );
        const result = await response.json();
        return NextResponse.json({ setup: 'ok', webhook_url: webhookUrl, telegram: result });
    }

    if (action === 'info') {
        const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getWebhookInfo`
        );
        return NextResponse.json(await response.json());
    }

    return NextResponse.json({ status: 'VENUZ Brain v3.1 active' });
}
