// ============================================
// VENUZ SCE: Notificaciones Proactivas a Telegram
// /lib/telegram-notify.ts
//
// El cerebro le avisa a Pablo sin que pregunte:
// - Scraping completado con resultados
// - Items de alto score esperando aprobación
// - Errores críticos
// - Resumen diario
// ============================================

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const OWNER_CHAT_ID = process.env.TELEGRAM_OWNER_ID || '8539603941';

async function send(text: string) {
    if (!TELEGRAM_TOKEN) {
        console.warn('[TELEGRAM] Bot token not configured, skipping notification');
        return;
    }

    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: OWNER_CHAT_ID,
                text,
                parse_mode: 'HTML',
            }),
        });
    } catch (error) {
        console.error('[TELEGRAM] Failed to send notification:', error);
    }
}

// ============================================
// NOTIFICACIONES ESPECÍFICAS
// ============================================

/** Avisar que el scraping terminó */
export async function notifyScrapeComplete(stats: {
    source: string;
    scraped: number;
    approved: number;
    rejected: number;
    duplicates: number;
}) {
    const emoji = stats.approved > 0 ? '🟢' : '🔴';
    await send(
        `${emoji} <b>Scraping completado</b>\n\n` +
        `📡 Fuente: ${stats.source}\n` +
        `📥 Scrapeados: ${stats.scraped}\n` +
        `✅ Aprobados: ${stats.approved}\n` +
        `❌ Rechazados: ${stats.rejected}\n` +
        `🔄 Duplicados: ${stats.duplicates}\n\n` +
        (stats.approved > 0 ? `👉 Escribe /pendientes para revisar` : '')
    );
}

/** Avisar de un item de alto score */
export async function notifyHighScoreItem(item: {
    title: string;
    category: string;
    score: number;
    id: string;
}) {
    if (item.score < 85) return; // Solo notificar scores altos

    await send(
        `🔥 <b>Item de alto score detectado</b>\n\n` +
        `<b>${item.title}</b>\n` +
        `📂 ${item.category} | ⭐ Score: ${item.score}/100\n\n` +
        `👉 Escribe /pendientes para aprobar`
    );
}

/** Error crítico */
export async function notifyError(context: string, error: string) {
    await send(
        `🚨 <b>Error en VENUZ</b>\n\n` +
        `📍 ${context}\n` +
        `❌ ${error.substring(0, 200)}`
    );
}

/** Resumen diario (llamar desde cron de las 9am) */
export async function notifyDailySummary(stats: {
    totalContent: number;
    newToday: number;
    pendingCount: number;
    topCategory: string;
}) {
    await send(
        `☀️ <b>Buenos días, jefe. Reporte VENUZ:</b>\n\n` +
        `📊 Feed total: ${stats.totalContent} items\n` +
        `🆕 Nuevos hoy: ${stats.newToday}\n` +
        `📥 Pendientes: ${stats.pendingCount}\n` +
        `🏆 Top categoría: ${stats.topCategory}\n\n` +
        (stats.pendingCount > 0 ? `👉 /pendientes para revisar` : `✅ Todo limpio`)
    );
}

/** Notificación genérica */
export async function notifyCustom(message: string) {
    await send(message);
}
