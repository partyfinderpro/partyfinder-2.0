// app/api/telegram/webhook/route.ts (ACTUALIZADO)

import { NextRequest, NextResponse } from 'next/server';
import { taskManager } from '@/lib/telegram/task-manager';
import { ctrAnalytics } from '@/lib/telegram/ctr-analytics';
import { logger } from '@/lib/logger';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

async function sendTelegramMessage(chatId: string, text: string, parseMode = 'Markdown') {
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: parseMode,
            }),
        });
    } catch (err) {
        logger.error('[Telegram Bot] Error sending message', { err, chatId });
    }
}

async function handleCommand(chatId: string, command: string, userId: string, args: string[]) {
    switch (command) {
        case '/start':
        case '/help':
            await sendTelegramMessage(
                chatId,
                `🎰 *VENUZ Bot V3 - Las Vegas Strip*\n\n` +
                `📊 /status — Estado del sistema\n` +
                `📋 /tasks — Tareas pendientes\n` +
                `📈 /stats — Métricas y CTR\n` +
                `🔧 /optimize — Optimizar bajo CTR\n` +
                `🧹 /cleanup — Limpiar duplicados\n` +
                `🔄 /refresh — Actualizar estadísticas\n\n` +
                `🕷 /scrape <url> [prioridad] — Scrapear sitio\n` +
                `   Ej: /scrape https://candy.ai/es 9\n\n` +
                `💰 /activar <dominio> <tu_id> — Activar afiliado\n` +
                `   Ej: /activar candy.ai pv123\n\n` +
                `Powered by Groq + Gemini 🧠`
            );
            break;

        case '/status':
            await handleStatusCommand(chatId);
            break;

        case '/tasks':
            await handleTasksCommand(chatId);
            break;

        case '/stats':
            await handleStatsCommand(chatId);
            break;

        case '/optimize':
            await handleOptimizeCommand(chatId, userId);
            break;

        case '/cleanup':
            await handleCleanupCommand(chatId, userId);
            break;

        case '/refresh':
            await handleRefreshCommand(chatId);
            break;

        case '/scrape': {
            const url = args[0];
            const priority = parseInt(args[1] || '7', 10);
            if (!url || !url.startsWith('http')) {
                await sendTelegramMessage(chatId, '⚠️ Uso: `/scrape <url> [prioridad]`\nEj: `/scrape https://candy.ai/es 9`');
                break;
            }
            await sendTelegramMessage(chatId, `🕷 Iniciando scrape de:\n\`${url}\`\nPrioridad: ${priority}\n\nEsto puede tomar ~30s...`);
            try {
                const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://labelbabel.com';
                const res = await fetch(`${baseUrl}/api/cron/vegas-scrape?source_url=${encodeURIComponent(url)}&priority=${priority}`, {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${process.env.CRON_SECRET || ''}` },
                });
                const data = await res.json();
                await sendTelegramMessage(
                    chatId,
                    `✅ *Scrape Completado*\n\n` +
                    `🌐 URL: ${url}\n` +
                    `📦 Items encontrados: ${data.items ?? 0}\n` +
                    `⏱ Tiempo: ${data.elapsed ?? '-'}\n` +
                    (data.errors?.length ? `\n⚠️ Errores (${data.errors.length}):\n${data.errors.slice(0, 3).join('\n')}` : '')
                );
            } catch (err: any) {
                await sendTelegramMessage(chatId, `❌ Error en scrape: ${err.message}`);
            }
            break;
        }

        case '/activar': {
            const domain = args[0];
            const affiliateId = args[1];
            if (!domain || !affiliateId) {
                await sendTelegramMessage(chatId, '⚠️ Uso: `/activar <dominio> <tu_id>`\nEj: `/activar candy.ai pv123`');
                break;
            }
            try {
                const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://labelbabel.com';
                const res = await fetch(`${baseUrl}/api/affiliate/activate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`,
                    },
                    body: JSON.stringify({ domain, affiliate_id: affiliateId }),
                });
                const data = await res.json();
                if (data.success) {
                    await sendTelegramMessage(
                        chatId,
                        `💰 *Afiliado Activado*\n\n🌐 ${domain}\n🆔 ID: \`${affiliateId}\`\n📦 Links actualizados: ${data.items_updated}\n\nDe ahora en adelante todos los links de este sitio llevarán tu ID. ✅`
                    );
                } else {
                    await sendTelegramMessage(chatId, `❌ Error: ${data.error}`);
                }
            } catch (err: any) {
                await sendTelegramMessage(chatId, `❌ Error activando afiliado: ${err.message}`);
            }
            break;
        }

        default:
            await sendTelegramMessage(chatId, `Comando no reconocido. Usa /help para ver comandos disponibles.`);
    }
}

async function handleStatusCommand(chatId: string) {
    try {
        const [taskStats, overallCTR] = await Promise.all([
            taskManager.getTaskStats(),
            ctrAnalytics.getOverallCTR('24h'),
        ]);

        const statusEmoji = taskStats.failed_today > 0 ? '🔴' : taskStats.running > 0 ? '🟡' : '🟢';

        const message =
            `${statusEmoji} *Estado del Sistema - VENUZ*\n\n` +
            `*Tareas:*\n` +
            `• Pendientes: ${taskStats.pending}\n` +
            `• En Ejecución: ${taskStats.running}\n` +
            `• Completadas Hoy: ${taskStats.completed_today}\n` +
            `• Fallidas Hoy: ${taskStats.failed_today}\n\n` +
            `*CTR (24h):*\n` +
            `• Impresiones: ${overallCTR.impressions.toLocaleString()}\n` +
            `• Clicks: ${overallCTR.clicks.toLocaleString()}\n` +
            `• CTR: ${overallCTR.ctr.toFixed(2)}%\n\n` +
            `Última actualización: ${new Date().toLocaleString('es-MX')}`;

        await sendTelegramMessage(chatId, message);
    } catch (err) {
        logger.error('[Telegram Bot] Error in /status command', { err });
        await sendTelegramMessage(chatId, '❌ Error al obtener el estado del sistema.');
    }
}

async function handleTasksCommand(chatId: string) {
    try {
        const pendingTasks = await taskManager.getPendingTasks();

        if (pendingTasks.length === 0) {
            await sendTelegramMessage(chatId, '✅ No hay tareas pendientes en este momento.');
            return;
        }

        let message = `📋 *Tareas Pendientes (${pendingTasks.length})*\n\n`;

        pendingTasks.slice(0, 10).forEach((task, index) => {
            const priorityEmoji = task.priority >= 8 ? '🔴' : task.priority >= 5 ? '🟡' : '🟢';
            message += `${index + 1}. ${priorityEmoji} *${task.title}*\n`;
            message += `   Tipo: ${task.task_type} | Prioridad: ${task.priority}\n`;
            if (task.description) {
                message += `   ${task.description.substring(0, 60)}...\n`;
            }
            message += `\n`;
        });

        if (pendingTasks.length > 10) {
            message += `\n_...y ${pendingTasks.length - 10} tareas más_`;
        }

        await sendTelegramMessage(chatId, message);
    } catch (err) {
        logger.error('[Telegram Bot] Error in /tasks command', { err });
        await sendTelegramMessage(chatId, '❌ Error al obtener tareas pendientes.');
    }
}

async function handleStatsCommand(chatId: string) {
    try {
        const [ctr24h, ctr7d, topContent, lowContent] = await Promise.all([
            ctrAnalytics.getOverallCTR('24h'),
            ctrAnalytics.getOverallCTR('7d'),
            ctrAnalytics.getTopPerformingContent(5),
            ctrAnalytics.getLowPerformingContent(1.0, 100, 5),
        ]);

        let message = `📈 *Métricas de la Plataforma*\n\n`;
        message += `*CTR General:*\n`;
        message += `• 24h: ${ctr24h.ctr.toFixed(2)}% (${ctr24h.impressions.toLocaleString()} imp)\n`;
        message += `• 7d: ${ctr7d.ctr.toFixed(2)}% (${ctr7d.impressions.toLocaleString()} imp)\n\n`;

        if (topContent.length > 0) {
            message += `*🏆 Top Contenido:*\n`;
            topContent.slice(0, 3).forEach((content, i) => {
                message += `${i + 1}. ${content.title.substring(0, 30)}...\n`;
                message += `   CTR: ${content.ctr_percentage.toFixed(2)}% | ${content.total_clicks} clicks\n`;
            });
            message += `\n`;
        }

        if (lowContent.length > 0) {
            message += `*⚠️ Contenido Bajo CTR (<1%):*\n`;
            message += `${lowContent.length} artículos necesitan optimización\n`;
        }

        await sendTelegramMessage(chatId, message);
    } catch (err) {
        logger.error('[Telegram Bot] Error in /stats command', { err });
        await sendTelegramMessage(chatId, '❌ Error al obtener estadísticas.');
    }
}

async function handleOptimizeCommand(chatId: string, userId: string) {
    try {
        const lowPerformingContent = await ctrAnalytics.getLowPerformingContent(1.0, 100, 20);

        if (lowPerformingContent.length === 0) {
            await sendTelegramMessage(chatId, '✅ No hay contenido que requiera optimización en este momento.');
            return;
        }

        // Crear tarea de optimización
        const task = await taskManager.createTask({
            taskType: 'optimize',
            title: `Optimizar ${lowPerformingContent.length} artículos con bajo CTR`,
            description: `CTR promedio: ${(lowPerformingContent.reduce((sum, c) => sum + c.ctr_percentage, 0) / lowPerformingContent.length).toFixed(2)}%`,
            priority: 7,
            triggeredBy: 'telegram_user',
            telegramUserId: userId,
            context: {
                content_ids: lowPerformingContent.map((c) => c.content_id),
                threshold: 1.0,
            },
        });

        if (task) {
            await sendTelegramMessage(
                chatId,
                `🔧 *Tarea de Optimización Creada*\n\n` +
                `Artículos a optimizar: ${lowPerformingContent.length}\n` +
                `Tarea ID: \`${task.id}\`\n\n` +
                `La tarea se ejecutará en los próximos minutos. Usa /tasks para monitorear.`
            );
        } else {
            await sendTelegramMessage(chatId, '❌ Error al crear tarea de optimización.');
        }
    } catch (err) {
        logger.error('[Telegram Bot] Error in /optimize command', { err });
        await sendTelegramMessage(chatId, '❌ Error al iniciar optimización.');
    }
}

async function handleCleanupCommand(chatId: string, userId: string) {
    try {
        const task = await taskManager.createTask({
            taskType: 'cleanup',
            title: 'Limpiar contenido duplicado y obsoleto',
            description: 'Remover duplicados y artículos antiguos sin engagement',
            priority: 5,
            triggeredBy: 'telegram_user',
            telegramUserId: userId,
        });

        if (task) {
            await sendTelegramMessage(
                chatId,
                `🧹 *Tarea de Limpieza Creada*\n\nTarea ID: \`${task.id}\`\n\nUsa /tasks para monitorear el progreso.`
            );
        } else {
            await sendTelegramMessage(chatId, '❌ Error al crear tarea de limpieza.');
        }
    } catch (err) {
        logger.error('[Telegram Bot] Error in /cleanup command', { err });
        await sendTelegramMessage(chatId, '❌ Error al iniciar limpieza.');
    }
}

async function handleRefreshCommand(chatId: string) {
    try {
        await sendTelegramMessage(chatId, '🔄 Actualizando estadísticas CTR...');

        const success = await ctrAnalytics.refreshStats();

        if (success) {
            await sendTelegramMessage(chatId, '✅ Estadísticas actualizadas correctamente. Usa /stats para ver los resultados.');
        } else {
            await sendTelegramMessage(chatId, '⚠️ Actualización completada con advertencias. Revisa los logs.');
        }
    } catch (err) {
        logger.error('[Telegram Bot] Error in /refresh command', { err });
        await sendTelegramMessage(chatId, '❌ Error al actualizar estadísticas.');
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const message = body.message;

        if (!message) {
            return NextResponse.json({ ok: true });
        }

        const chatId = message.chat.id.toString();
        const text = message.text || '';
        const userId = message.from.id.toString();

        // Manejar comandos
        if (text.startsWith('/')) {
            const parts = text.trim().split(/\s+/);
            const command = parts[0].split('@')[0]; // strip bot username if present
            const args = parts.slice(1);
            await handleCommand(chatId, command, userId, args);
            return NextResponse.json({ ok: true });
        }

        // Respuesta genérica para mensajes no-comando
        await sendTelegramMessage(
            chatId,
            'Soy el Bot de VENUZ. Usa /start para ver los comandos disponibles.'
        );

        return NextResponse.json({ ok: true });
    } catch (error) {
        logger.error('[Telegram Webhook] Error processing update', { error });
        return NextResponse.json({ ok: true }); // Always return 200 to Telegram
    }
}
