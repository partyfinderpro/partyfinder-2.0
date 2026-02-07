// app/api/cron/notify-events/route.ts
// Cron job para notificar a usuarios sobre eventos cercanos
// Ejecutar diariamente a las 10:00 AM

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    // Verificar autorización
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[Notify Events] Buscando eventos próximos...');

        // Buscar eventos en las próximas 24-48 horas
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        // Obtener eventos temporales (no permanentes) próximos
        const { data: upcomingEvents, error: eventsError } = await supabase
            .from('content')
            .select('id, title, location, event_date, category, image_url')
            .eq('active', true)
            .eq('is_permanent', false)
            .gte('event_date', tomorrow.toISOString())
            .lte('event_date', dayAfter.toISOString())
            .order('event_date', { ascending: true })
            .limit(5);

        if (eventsError) {
            console.error('[Notify Events] Error fetching events:', eventsError);
            throw eventsError;
        }

        if (!upcomingEvents || upcomingEvents.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No upcoming events found',
                notificationsSent: 0,
            });
        }

        console.log(`[Notify Events] Found ${upcomingEvents.length} upcoming events`);

        // Construir mensaje de notificación
        const topEvent = upcomingEvents[0];
        const eventCount = upcomingEvents.length;

        const notificationPayload = {
            title: '🎉 Eventos cerca de ti mañana',
            body: eventCount > 1
                ? `${topEvent.title} y ${eventCount - 1} evento(s) más en ${topEvent.location || 'tu zona'}`
                : `${topEvent.title} en ${topEvent.location || 'tu zona'}`,
            url: '/?mode=cerca',
            icon: topEvent.image_url || '/icons/icon-192x192.png',
        };

        // Enviar notificación usando nuestro endpoint
        const sendResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://venuz-app.vercel.app'}/api/push/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CRON_SECRET}`,
            },
            body: JSON.stringify(notificationPayload),
        });

        const sendResult = await sendResponse.json();

        return NextResponse.json({
            success: true,
            eventsFound: upcomingEvents.length,
            notificationResult: sendResult,
            topEvent: topEvent.title,
        });

    } catch (error: any) {
        console.error('[Notify Events] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
