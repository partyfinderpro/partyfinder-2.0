// ============================================
// VENUZ SCE: Bot de Telegram — Control Remoto CEO
// /app/api/telegram/webhook/route.ts
//
// Pablo controla VENUZ desde Telegram:
// /status /pendientes /aprobar /rechazar /scrape /stats /help
//
// Webhook: Telegram envía mensajes aquí →
// El bot procesa comandos → Responde en Telegram
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
        }),
    });
}

async function answerCallback(callbackId: string, text: string) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            callback_query_id: callbackId,
            text,
        }),
    });
}

// ============================================
// SUPABASE QUERIES
// ============================================
async function supabaseQuery(endpoint: string, method: string = 'GET', body?: unknown) {
    const headers: Record<string, string> = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
    };

    if (method === 'GET') {
        headers['Accept'] = 'application/json';
    }

    const options: RequestInit = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, options);
    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Supabase error: ${err}`);
    }

    return method === 'GET' ? response.json() : response;
}

// ============================================
// COMANDOS DEL BOT
// ============================================

async function cmdStatus(chatId: string) {
    try {
        // Total content activo
        const content = await supabaseQuery('content?active=eq.true&select=id', 'GET');
        const totalContent = Array.isArray(content) ? content.length : 0;

        // Pendientes
        const pending = await supabaseQuery('pending_events?status=eq.pending&select=id', 'GET');
        const totalPending = Array.isArray(pending) ? pending.length : 0;

        // Aprobados hoy
        const today = new Date().toISOString().split('T')[0];
        const approvedToday = await supabaseQuery(
            `pending_events?status=eq.approved&reviewed_at=gte.${today}T00:00:00&select=id`, 'GET'
        );
        const totalApprovedToday = Array.isArray(approvedToday) ? approvedToday.length : 0;

        const msg = `🧠 <b>VENUZ Brain — Estado</b>

📊 <b>Feed:</b> ${totalContent} items activos
📥 <b>Pendientes:</b> ${totalPending} por revisar
✅ <b>Aprobados hoy:</b> ${totalApprovedToday}

🌐 <b>Producción:</b> <a href="${APP_URL}">Ver app</a>
⏰ <b>Última revisión:</b> ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`;

        await sendMessage(chatId, msg);
    } catch (error) {
        await sendMessage(chatId, `❌ Error obteniendo status: ${error}`);
    }
}

async function cmdPendientes(chatId: string) {
    try {
        const pending = await supabaseQuery(
            'pending_events?status=eq.pending&select=id,suggested_title,suggested_category,quality_score_suggested,reason,created_at&order=quality_score_suggested.desc&limit=10',
            'GET'
        );

        if (!Array.isArray(pending) || pending.length === 0) {
            await sendMessage(chatId, '✅ No hay pendientes. ¡Todo limpio, jefe!');
            return;
        }

        for (let i = 0; i < pending.length; i++) {
            const item = pending[i];
            const shortId = item.id.substring(0, 8);

            const msg = `📋 <b>#${i + 1}</b> | Score: <b>${item.quality_score_suggested}/100</b>
      
<b>${item.suggested_title || 'Sin título'}</b>
📂 ${item.suggested_category || '?'}
💬 ${item.reason || 'Sin razón'}
🕐 ${new Date(item.created_at).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`;

            const buttons = [
                [
                    { text: '✅ Aprobar', callback_data: `approve_${item.id}` },
                    { text: '❌ Rechazar', callback_data: `reject_${item.id}` },
                ],
            ];

            await sendMessageWithButtons(chatId, msg, buttons);
        }

        await sendMessage(chatId, `📊 Total pendientes: <b>${pending.length}</b>`);
    } catch (error) {
        await sendMessage(chatId, `❌ Error: ${error}`);
    }
}

async function cmdAprobar(chatId: string, pendingId: string) {
    try {
        // Llamar la RPC approve_pending_event
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/approve_pending_event`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ p_pending_id: pendingId }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err);
        }

        await sendMessage(chatId, `✅ <b>Aprobado y movido al feed.</b>\nID: ${pendingId.substring(0, 8)}...`);
    } catch (error) {
        await sendMessage(chatId, `❌ Error aprobando: ${error}`);
    }
}

async function cmdRechazar(chatId: string, pendingId: string) {
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/pending_events?id=eq.${pendingId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
                status: 'rejected',
                reviewed_by: 'pablo_telegram',
                reviewed_at: new Date().toISOString(),
            }),
        });

        await sendMessage(chatId, `❌ <b>Rechazado.</b>\nID: ${pendingId.substring(0, 8)}...`);
    } catch (error) {
        await sendMessage(chatId, `❌ Error rechazando: ${error}`);
    }
}

async function cmdAprobarTodo(chatId: string) {
    try {
        const pending = await supabaseQuery(
            'pending_events?status=eq.pending&quality_score_suggested=gte.75&select=id,suggested_title,quality_score_suggested',
            'GET'
        );

        if (!Array.isArray(pending) || pending.length === 0) {
            await sendMessage(chatId, '📭 No hay items con score ≥ 75 para aprobar.');
            return;
        }

        let approved = 0;
        let failed = 0;

        for (const item of pending) {
            try {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/approve_pending_event`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ p_pending_id: item.id }),
                });
                if (response.ok) approved++;
                else failed++;
            } catch {
                failed++;
            }
        }

        await sendMessage(chatId, `🚀 <b>Aprobación masiva completa</b>\n\n✅ Aprobados: ${approved}\n❌ Fallidos: ${failed}\n\n(Solo items con score ≥ 75)`);
    } catch (error) {
        await sendMessage(chatId, `❌ Error: ${error}`);
    }
}

async function cmdScrape(chatId: string) {
    try {
        await sendMessage(chatId, '🔄 Ejecutando scraping cognitivo...');

        const response = await fetch(`${APP_URL}/api/cron/ingest-events`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

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
        await sendMessage(chatId, `❌ Error en scraping: ${error}`);
    }
}

async function cmdStats(chatId: string) {
    try {
        // Contar por categoría
        const content = await supabaseQuery(
            'content?active=eq.true&select=category',
            'GET'
        );

        const categories: Record<string, number> = {};
        if (Array.isArray(content)) {
            for (const item of content) {
                const cat = item.category || 'sin_categoría';
                categories[cat] = (categories[cat] || 0) + 1;
            }
        }

        // Ordenar por cantidad
        const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);

        let msg = `📊 <b>VENUZ Stats</b>\n\n<b>Contenido por categoría:</b>\n`;
        for (const [cat, count] of sorted) {
            const bar = '█'.repeat(Math.min(Math.round(count / 30), 15));
            msg += `${cat}: <b>${count}</b> ${bar}\n`;
        }

        msg += `\n<b>Total:</b> ${Array.isArray(content) ? content.length : 0} items activos`;

        await sendMessage(chatId, msg);
    } catch (error) {
        await sendMessage(chatId, `❌ Error: ${error}`);
    }
}

async function cmdHelp(chatId: string) {
    const msg = `🧠 <b>VENUZ Brain — Comandos</b>

📊 /status — Estado general del sistema
📥 /pendientes — Ver items por aprobar (con botones ✅❌)
✅ /aprobar_todo — Aprobar todos con score ≥ 75
🔄 /scrape — Ejecutar scraping ahora
📈 /stats — Estadísticas de contenido
❓ /help — Esta lista

<b>Desde botones:</b>
Cada item pendiente tiene botones de ✅ Aprobar y ❌ Rechazar

<b>Tu rol:</b> CEO de VENUZ 👑
El cerebro trabaja solo, tú solo apruebas lo bueno.`;

    await sendMessage(chatId, msg);
}

// ============================================
// WEBHOOK HANDLER
// ============================================
export async function POST(req: Request) {
    try {
        const update = await req.json();

        // --- Callback queries (botones inline) ---
        if (update.callback_query) {
            const callback = update.callback_query;
            const chatId = String(callback.message?.chat?.id || '');
            const data = callback.data || '';

            // Verificar que es el dueño
            if (chatId !== OWNER_CHAT_ID) {
                await answerCallback(callback.id, '⛔ No autorizado');
                return NextResponse.json({ ok: true });
            }

            if (data.startsWith('approve_')) {
                const pendingId = data.replace('approve_', '');
                await cmdAprobar(chatId, pendingId);
                await answerCallback(callback.id, '✅ Aprobado');
            } else if (data.startsWith('reject_')) {
                const pendingId = data.replace('reject_', '');
                await cmdRechazar(chatId, pendingId);
                await answerCallback(callback.id, '❌ Rechazado');
            }

            return NextResponse.json({ ok: true });
        }

        // --- Mensajes de texto (comandos) ---
        const message = update.message;
        if (!message?.text) return NextResponse.json({ ok: true });

        const chatId = String(message.chat.id);
        const text = message.text.trim().toLowerCase();

        // Verificar que es el dueño
        if (chatId !== OWNER_CHAT_ID) {
            await sendMessage(chatId, '⛔ No autorizado. Este bot es exclusivo del CEO de VENUZ.');
            return NextResponse.json({ ok: true });
        }

        // Routing de comandos
        if (text === '/start') {
            await sendMessage(chatId, `👑 <b>¡Bienvenido, Pablo!</b>\n\nSoy el cerebro de VENUZ. Contrólame desde aquí.\n\nEscribe /help para ver comandos.`);
        } else if (text === '/status') {
            await cmdStatus(chatId);
        } else if (text === '/pendientes') {
            await cmdPendientes(chatId);
        } else if (text === '/aprobar_todo') {
            await cmdAprobarTodo(chatId);
        } else if (text === '/scrape') {
            await cmdScrape(chatId);
        } else if (text === '/stats') {
            await cmdStats(chatId);
        } else if (text === '/help') {
            await cmdHelp(chatId);
        } else if (text.startsWith('/aprobar ')) {
            // /aprobar UUID
            const id = text.replace('/aprobar ', '').trim();
            await cmdAprobar(chatId, id);
        } else if (text.startsWith('/rechazar ')) {
            const id = text.replace('/rechazar ', '').trim();
            await cmdRechazar(chatId, id);
        } else {
            // Mensaje no reconocido
            await sendMessage(chatId, `🤔 No entendí. Usa /help para ver comandos disponibles.`);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Telegram webhook error:', error);
        return NextResponse.json({ ok: true }); // Siempre 200 para Telegram
    }
}

// ============================================
// GET: Setup del webhook (llamar una sola vez)
// ============================================
export async function GET(req: Request) {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'setup') {
        // Registrar webhook en Telegram
        const webhookUrl = `${APP_URL}/api/telegram/webhook`;

        const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
        );

        const result = await response.json();

        return NextResponse.json({
            message: 'Webhook setup',
            webhook_url: webhookUrl,
            telegram_response: result,
        });
    }

    if (action === 'info') {
        const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getWebhookInfo`
        );
        const result = await response.json();
        return NextResponse.json(result);
    }

    return NextResponse.json({
        message: 'VENUZ Telegram Bot endpoint',
        setup: `${APP_URL}/api/telegram/webhook?action=setup`,
        info: `${APP_URL}/api/telegram/webhook?action=info`,
    });
}
