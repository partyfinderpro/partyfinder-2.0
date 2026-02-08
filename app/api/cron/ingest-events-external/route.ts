import { NextResponse } from 'next/server';

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://partyfinder-2-0.vercel.app';

export const runtime = 'edge';

async function updateSourceStatus(sourceName: string, success: boolean, errorMsg?: string) {
    try {
        // Obtenemos el registro actual
        const res = await fetch(`${SUPABASE_URL}/rest/v1/external_event_sources?source_name=eq.${sourceName}&select=failure_count`, {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            },
        });

        if (!res.ok) return;
        const data = await res.json();
        const currentFailures = data[0]?.failure_count || 0;

        const updatePayload: any = {
            last_success: success ? new Date().toISOString() : undefined,
            failure_count: success ? 0 : currentFailures + 1
        };

        if (!success && errorMsg) {
            // Podríamos guardar el error en logs si quisiéramos
            console.error(`Source ${sourceName} failed: ${errorMsg}`);
        }

        await fetch(`${SUPABASE_URL}/rest/v1/external_event_sources?source_name=eq.${sourceName}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatePayload),
        });

    } catch (err) {
        console.error('Error updating source status:', err);
    }
}

export async function GET() {
    if (!TICKETMASTER_API_KEY) {
        return NextResponse.json({ error: 'Ticketmaster API Key missing' }, { status: 500 });
    }

    try {
        let ingested = 0;

        // 1. Ticketmaster México (conciertos, eventos)
        const tmUrl = `https://app.ticketmaster.com/discovery/v2/events.json?countryCode=MX&classificationName=music,arts,sports&apikey=${TICKETMASTER_API_KEY}&size=50&sort=date,asc`;
        const tmRes = await fetch(tmUrl);

        if (!tmRes.ok) {
            await updateSourceStatus('ticketmaster', false, `API returned ${tmRes.status}`);
            throw new Error(`Ticketmaster API failed: ${tmRes.status}`);
        }

        const tmData = await tmRes.json();
        const events = tmData._embedded?.events || [];

        for (const event of events) {
            const raw_data = {
                title: event.name,
                description: event.info || event.pleaseNote || 'Evento destacado en Ticketmaster',
                image_url: event.images?.find((img: any) => img.width > 800)?.url || event.images?.[0]?.url,
                source_url: event.url,
                lat: event._embedded?.venues?.[0]?.location?.latitude || null,
                lng: event._embedded?.venues?.[0]?.location?.longitude || null,
                start_time: event.dates?.start?.localDate,
                category_raw: event.classifications?.[0]?.segment?.name || 'evento',
                source_id: event.id
            };

            // Enviamos al cerebro cognitivo para clasificación y deduplicación
            const classifyRes = await fetch(`${APP_URL}/api/cognitive/classify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ raw_data, source_scraper: 'ticketmaster' }),
            });

            if (classifyRes.ok) ingested++;
        }

        await updateSourceStatus('ticketmaster', true);

        // 2. Facebook Events (Placeholder para integración futura)
        // await fetch('/api/scrape/facebook-events-pvr'); 

        return NextResponse.json({
            success: true,
            ingested_ticketmaster: ingested,
            total_ingested: ingested
        });

    } catch (error: any) {
        console.error('EventBrain cron error:', error);

        // Alert Telegram
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_OWNER_ID) {
            await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: process.env.TELEGRAM_OWNER_ID,
                    text: `🚨 EventBrain falló: ${error.message}`,
                }),
            }).catch(err => console.error('Telegram alert failed', err));
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
