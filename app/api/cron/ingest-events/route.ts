import { NextResponse } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://labelbabel.com';

// Coordenadas centrales Puerto Vallarta
const PVR_LAT = 20.6534;
const PVR_LNG = -105.2253;
const RADIUS = 50000; // 50km

export async function GET() {
    try {
        let allPlaces: any[] = [];
        let nextPageToken: string | null = null;
        let pageCount = 0;
        const maxPages = 3; // Limit pages to avoid timeout

        do {
            let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${PVR_LAT},${PVR_LNG}&radius=${RADIUS}&type=night_club|bar|restaurant|point_of_interest&key=${GOOGLE_PLACES_API_KEY}`;
            if (nextPageToken) {
                url += `&pagetoken=${nextPageToken}`;
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error(`Google Places error: ${res.status}`);

            const data = await res.json();
            if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
                // Si se acaba la cuota o hay error, loguear pero continuar con lo que se tiene
                console.warn(`Google Places warning: ${data.status}`);
                break;
            }

            allPlaces = allPlaces.concat(data.results || []);

            nextPageToken = data.next_page_token || null;
            pageCount++;

            // Google requiere delay entre paginaciones
            if (nextPageToken && pageCount < maxPages) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                nextPageToken = null;
            }

        } while (nextPageToken);

        console.log(`Google Places: ${allPlaces.length} resultados encontrados`);

        // Enviar cada uno al cerebro cognitivo
        for (const place of allPlaces) {
            const raw_data = {
                title: place.name,
                description: place.editorial_summary?.overview || '',
                image_url: place.photos?.[0] ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}` : null,
                source_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng,
                category_raw: place.types?.join(', '),
            };

            // Llamada interna al endpoint classify
            await fetch(`${APP_URL}/api/cognitive/classify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ raw_data, source_scraper: 'google_places' }),
            });
        }

        // Notificar éxito (opcional, si tienes el módulo de notificaciones)
        // await notifyScrapeComplete(allPlaces.length); 

        return NextResponse.json({ success: true, ingested: allPlaces.length });
    } catch (error: any) {
        console.error('Google Places cron error:', error);

        // Alert Telegram
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const ownerId = process.env.TELEGRAM_OWNER_ID;

        if (token && ownerId) {
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: ownerId,
                    text: `🚨 Google Places scraper falló: ${error.message}`,
                }),
            });
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const runtime = 'edge';
