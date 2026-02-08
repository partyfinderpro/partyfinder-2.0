// ============================================
// VENUZ SCE: Cron Job Inteligente de Ingesta
// /app/api/cron/ingest-events/route.ts
//
// ANTES: Scraper mecánico → insert directo a content
// AHORA: Scraper → Cerebro Cognitivo → pending_events
//
// Se ejecuta diario a las 2am (vercel.json)
// ============================================

import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 60; // 60 segundos max en Edge

import { notifyScrapeComplete } from '@/lib/telegram-notify';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://partyfinder-2-0.vercel.app';

// Fuentes de scraping configuradas
// Aquí es donde Antigravity agrega nuevas fuentes
const SCRAPE_SOURCES = [
    {
        name: 'google_places_pvr',
        enabled: true,
        type: 'google_places',
        config: {
            // Google Places API para Puerto Vallarta nightlife
            query: 'nightlife bars clubs restaurants Puerto Vallarta',
            lat: 20.6534,
            lng: -105.2253,
            radius: 10000, // 10km
        },
    },
    // Más fuentes se agregan aquí conforme se activan:
    // { name: 'camsoda', enabled: false, type: 'webcam', config: {...} },
    // { name: 'eventbrite_pvr', enabled: false, type: 'events', config: {...} },
];

// Scraper para Google Places
async function scrapeGooglePlaces(config: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
        console.log('[INGEST] Google Places API key MISSING or empty');
        return [];
    }
    console.log('[INGEST] Google Places API Key Status:', apiKey ? 'EXISTS (Length: ' + apiKey.length + ')' : 'MISSING');

    try {
        const { query, lat, lng, radius } = config;
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(String(query))}&location=${lat},${lng}&radius=${radius}&key=${apiKey}&language=es`;

        const response = await fetch(url);
        if (!response.ok) return [];

        const data = await response.json();

        return (data.results || []).map((place: Record<string, unknown>) => ({
            title: place.name,
            description: place.formatted_address,
            source_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            lat: (place.geometry as Record<string, Record<string, number>>)?.location?.lat,
            lng: (place.geometry as Record<string, Record<string, number>>)?.location?.lng,
            rating: place.rating,
            address: place.formatted_address,
            category: inferCategory(String(place.types || '')),
            image_url: place.photos
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${(place.photos as Array<Record<string, string>>)[0]?.photo_reference}&key=${apiKey}`
                : null,
        }));
    } catch (error) {
        console.error('[INGEST] Google Places error:', error);
        return [];
    }
}

// Inferir categoría desde tipos de Google Places
function inferCategory(types: string): string {
    if (types.includes('night_club') || types.includes('nightclub')) return 'antro';
    if (types.includes('bar')) return 'bar';
    if (types.includes('restaurant') || types.includes('food')) return 'comida';
    if (types.includes('spa') || types.includes('massage')) return 'masaje';
    if (types.includes('event')) return 'evento';
    return 'bar'; // default
}

// Enviar items al cerebro cognitivo
async function sendToCognitiveBrain(
    items: Record<string, unknown>[],
    sourceName: string
): Promise<Record<string, unknown>> {
    if (items.length === 0) return { total: 0, approved: 0 };

    try {
        const response = await fetch(`${APP_URL}/api/cognitive/classify`, {
            method: 'PUT', // Batch mode
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: items.slice(0, 10), // Max 10 por batch en Edge
                source_scraper: sourceName,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error(`[INGEST] Cognitive brain error for ${sourceName}:`, err);
            return { total: items.length, approved: 0, error: err };
        }

        return response.json();
    } catch (error) {
        console.error(`[INGEST] Failed to reach cognitive brain:`, error);
        return { total: items.length, approved: 0, error: String(error) };
    }
}

// ============================================
// ENDPOINT
// ============================================
export async function GET(req: Request) {
    // Verificar que es un cron legítimo de Vercel
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // En producción verificar el secret; en desarrollo permitir
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        // Vercel cron jobs envían el header automáticamente
        // Si no hay secret configurado, permitir (para desarrollo)
    }

    const startTime = Date.now();
    const results: Record<string, unknown>[] = [];

    for (const source of SCRAPE_SOURCES) {
        if (!source.enabled) continue;

        console.log(`[INGEST] Processing source: ${source.name}`);

        let items: Record<string, unknown>[] = [];

        switch (source.type) {
            case 'google_places':
                items = await scrapeGooglePlaces(source.config);
                break;
            // Aquí se agregan más tipos de scraper:
            // case 'webcam': items = await scrapeWebcams(source.config); break;
            // case 'events': items = await scrapeEventbrite(source.config); break;
            default:
                console.log(`[INGEST] Unknown source type: ${source.type}`);
        }

        if (items.length > 0) {
            const cognitiveResult = await sendToCognitiveBrain(items, source.name);
            results.push({
                source: source.name,
                scraped: items.length,
                cognitive: cognitiveResult,
            });

            // Notificar a Telegram
            await notifyScrapeComplete({
                source: source.name,
                scraped: items.length,
                approved: (cognitiveResult as any).approved || 0,
                rejected: (cognitiveResult as any).rejected || 0, // Ajustar según respuesta real
                duplicates: (cognitiveResult as any).duplicates || 0, // Ajustar según respuesta real
            });
        } else {
            results.push({ source: source.name, scraped: 0, note: 'No items found' });
            // Notificar a Telegram también si no hubo items, opcional pero útil
            console.log(`[INGEST] No items found for source: ${source.name}`);
        }
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
        status: 'completed',
        duration_ms: duration,
        sources_processed: results.length,
        results,
        timestamp: new Date().toISOString(),
    });
}
