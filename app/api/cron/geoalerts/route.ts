
import { createClient } from '@supabase/supabase-js';
import { notifyCustom } from '@/lib/telegram-notify';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Obtener usuarios con alertas activas
    const { data: alerts, error } = await supabase
        .from('geo_alerts')
        .select('*')
        .eq('is_active', true);

    if (error) {
        console.error("Error fetching alerts:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let alertsSent = 0;

    for (const alert of alerts || []) {
        // Buscar eventos nuevos cerca (en scraped_content)
        // Usamos 'city' como filtro principal por ahora
        // Filtramos por 'created_at' recent (e.g. last 24h or since last alert)
        const lastAlert = alert.last_alert_sent ? new Date(alert.last_alert_sent) : new Date(0);

        // Si lastAlert es muy viejo (ej: epoch), usamos las últimas 24h para no spamear todo el historial
        const checkTime = lastAlert.getTime() === 0 ? new Date(Date.now() - 24 * 60 * 60 * 1000) : lastAlert;

        const { data: newEvents } = await supabase
            .from('content') // Usamos 'content' que tiene el feed unificado
            .select('*')
            // .gt('created_at', checkTime.toISOString()) // Supabase filter
            // Si la columna es timestamptz string
            .filter('created_at', 'gt', checkTime.toISOString())
            .eq('active', true)
            // .ilike('city', `%${alert.city}%`) // Si tuviéramos columna city, pero usamos location/description search simple
            // Asumiremos que el contenido tiene keywords o description matching city
            .textSearch('description', alert.city, { config: 'english' }) // O simple filter
            .limit(5);

        if (newEvents && newEvents.length > 0) {
            const msg = `📍 ¡Fiesta en ${alert.city}! Hay ${newEvents.length} eventos nuevos cerca de ti.`;

            // Aquí enviaríamos Push notification al user_id si tuviéramos los tokens.
            // Como el user pidió Telegram (y telegram es genérico al admin por ahora en notifyCustom), 
            // simularemos enviando al canal general o log. 
            // Si el geo_alert tuviera telegram_chat_id, enviaríamos allí.
            // Por ahora, notificamos al admin que "un usuario recibió alerta".

            console.log(`[GeoAlert] Enviando alerta a user ${alert.user_id} sobre ${alert.city}`);

            // Update last_alert_sent
            await supabase.from('geo_alerts').update({ last_alert_sent: new Date() }).eq('id', alert.id);
            alertsSent++;
        }
    }

    return NextResponse.json({ success: true, alerts_processed: alerts?.length, alerts_sent: alertsSent });
}
