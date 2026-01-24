// app/api/cron/scraper/route.ts
// Motor de automatización de VENUZ

import { NextRequest, NextResponse } from 'next/server';
import { runApifyActor } from '@/lib/apify';

export const maxDuration = 300;

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isManualTrigger = request.nextUrl.searchParams.get('key') === process.env.SCRAPER_API_KEY;

    if (!isVercelCron && !isManualTrigger) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[VENUZ CRON] Iniciando ciclo de scraping...');

        // Lista de actores de Apify a disparar (Sugerencia basándonos en la Fase 2)
        const actors = [
            process.env.APIFY_ACTOR_WATCHER, // Ejemplo: Scraper de alertas
            process.env.APIFY_ACTOR_HUNTER,  // Ejemplo: Scraper de locales
            process.env.APIFY_ACTOR_SEDUCER  // Ejemplo: Scraper de modelos
        ].filter(Boolean);

        const results = [];

        if (actors.length > 0) {
            for (const actorId of actors) {
                const run = await runApifyActor(actorId as string);
                results.push({ actorId, status: run ? 'started' : 'failed', runId: run?.id });
            }
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            actors_triggered: results,
            message: actors.length === 0
                ? 'No hay actores de Apify configurados. Define APIFY_ACTOR_... en Vercel.'
                : 'Scrapers iniciados en Apify.'
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    return GET(request);
}
