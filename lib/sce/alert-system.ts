// lib/sce/alert-system.ts
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  }

  return createClient(url, key);
};

/**
 * Enviar alerta a Telegram
 */
export async function sendTelegramAlert(message: string, severity: 'info' | 'warning' | 'critical' = 'info') {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('⚠️  Telegram no configurado (faltan TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID)');
    return false;
  }

  const emoji = {
    info: 'ℹ️',
    warning: '⚠️',
    critical: '🚨',
  }[severity];

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `${emoji} <b>SCE Alert</b>\n\n${message}`,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }

    return true;
  } catch (error: any) {
    console.error('❌ Error enviando alerta Telegram:', error.message);
    return false;
  }
}

/**
 * Enviar reporte diario
 */
export async function sendDailyReport() {
  const supabase = getSupabase();

  const { data: alerts } = await supabase
    .from('sce_alerts')
    .select('*')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  const { data: sources } = await supabase
    .from('sce_sources')
    .select('*')
    .eq('is_active', true);

  const failedSources = sources?.filter(s => s.fail_count >= 3) || [];
  const totalAlerts = alerts?.length || 0;
  const criticalAlerts = alerts?.filter(a => a.severity === 'critical').length || 0;

  const message = `
📊 <b>Reporte Diario SCE</b>
📅 ${new Date().toLocaleDateString('es-MX')}

🔢 Fuentes activas: ${sources?.length || 0}
❌ Fuentes fallidas: ${failedSources.length}
🔔 Alertas totales (24h): ${totalAlerts}
🚨 Alertas críticas: ${criticalAlerts}

${failedSources.length > 0 ? `\n⚠️ <b>Fuentes con problemas:</b>\n${failedSources.map(s => `- ${s.name} (${s.fail_count} fallos)`).join('\n')}` : ''}
  `.trim();

  await sendTelegramAlert(message, criticalAlerts > 0 ? 'critical' : 'info');
}

/**
 * Procesar alertas pendientes y enviarlas
 */
export async function processAlerts() {
  const supabase = getSupabase();

  const { data: alerts } = await supabase
    .from('sce_alerts')
    .select('*')
    .eq('is_read', false)
    .order('created_at', { ascending: true })
    .limit(10);

  if (!alerts || alerts.length === 0) return;

  for (const alert of alerts) {
    const message = `<b>${alert.title}</b>\n\n${alert.message}`;
    const sent = await sendTelegramAlert(message, alert.severity as any);

    if (sent) {
      await supabase
        .from('sce_alerts')
        .update({ is_read: true })
        .eq('id', alert.id);
    }
  }
}
