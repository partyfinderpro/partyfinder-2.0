// app/api/cron/proactive-alerts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { taskManager } from '@/lib/telegram/task-manager';
import { ctrAnalytics } from '@/lib/telegram/ctr-analytics';
import { logger } from '@/lib/logger';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '';

async function sendAlert(message: string) {
    if (!ADMIN_CHAT_ID || !BOT_TOKEN) return;

    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_CHAT_ID,
                text: message,
                parse_mode: 'Markdown',
            }),
        });
    } catch (err) {
        logger.error('[Proactive Alerts] Error sending alert', { err });
    }
}

export async function GET(request: NextRequest) {
    try {
        // Verificar autenticación (cron secret)
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const alerts: string[] = [];

        // 1. Verificar CTR bajo
        const ctr24h = await ctrAnalytics.getOverallCTR('24h');
        if (ctr24h.impressions > 1000 && ctr24h.ctr < 0.5) {
            alerts.push(
                `⚠️ *Alerta: CTR Bajo*\n\n` +
                `CTR 24h: ${ctr24h.ctr.toFixed(2)}% (umbral: 0.5%)\n` +
                `Impresiones: ${ctr24h.impressions.toLocaleString()}\n` +
                `Clicks: ${ctr24h.clicks}\n\n` +
                `Considera ejecutar /optimize`
            );
        }

        // 2. Verificar tareas fallidas
        const taskStats = await taskManager.getTaskStats();
        if (taskStats.failed_today > 5) {
            alerts.push(
                `🔴 *Alerta: Múltiples Tareas Fallidas*\n\n` +
                `Fallidas hoy: ${taskStats.failed_today}\n` +
                `Revisa los logs para identificar el problema.`
            );
        }

        // 3. Verificar tareas pendientes acumuladas
        if (taskStats.pending > 20) {
            alerts.push(
                `🟡 *Alerta: Acumulación de Tareas*\n\n` +
                `Tareas pendientes: ${taskStats.pending}\n` +
                `El sistema puede estar sobrecargado.`
            );
        }

        // 4. TODO: Verificar errores en scraping (requiere implementar tracking)
        // 5. TODO: Verificar contenido nuevo insuficiente (requiere implementar tracking)

        // Enviar todas las alertas
        for (const alert of alerts) {
            await sendAlert(alert);
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Rate limit
        }

        return NextResponse.json({
            success: true,
            alerts_sent: alerts.length,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error('[Proactive Alerts] Error in cron job', { error });
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
