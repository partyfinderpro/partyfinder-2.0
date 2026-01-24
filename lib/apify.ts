// lib/apify.ts
// Cliente de Apify para disparar scrapers desde la web

import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: process.env.APIFY_TOKEN,
});

/**
 * Dispara un actor de Apify
 * @param actorId El ID del actor o nombre (ej: "apify/instagram-scraper")
 * @param input Parámetros para el actor
 */
export async function runApifyActor(actorId: string, input: any = {}) {
    try {
        if (!process.env.APIFY_TOKEN) {
            console.error('[APIFY] API Token no configurado');
            return null;
        }

        console.log(`[APIFY] Disparando actor: ${actorId}`);
        const run = await client.actor(actorId).start(input);

        return run;
    } catch (error: any) {
        console.error(`[APIFY] Error disparando actor ${actorId}:`, error.message);
        return null;
    }
}

/**
 * Obtiene el estado de los últimos runs
 */
export async function getLatestRuns(actorId: string, limit = 5) {
    if (!process.env.APIFY_TOKEN) return [];
    return await client.actor(actorId).runs().list({ limit, desc: true });
}
