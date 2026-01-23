// app/api/cron/scraper/route.ts
// Endpoint para Vercel Cron Jobs
// Ejecuta scrapers de forma segura

import { NextRequest, NextResponse } from 'next/server';

// Configuración de Vercel para timeout extendido
export const maxDuration = 300; // 5 minutos máximo (solo en plan Pro)

export async function GET(request: NextRequest) {
    console.log('[VENUZ CRON] Scraper triggered at', new Date().toISOString());

    // Verificar autorización
    const authHeader = request.headers.get('authorization');
    const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isManualTrigger = request.nextUrl.searchParams.get('key') === process.env.SCRAPER_API_KEY;

    if (!isVercelCron && !isManualTrigger) {
        console.warn('[VENUZ CRON] Unauthorized attempt');
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const startTime = Date.now();

        // NOTA: Los scrapers usan CommonJS y no son compatibles con el build de Next.js
        // Por ahora, este endpoint solo registra la intención de ejecutar
        // Los scrapers deben ejecutarse manualmente: node scripts/scraper.js

        // En el futuro, cuando migremos los scrapers a ESM, descomentar:
        // const { runOmniScraper } = await import('@/scripts/scraper');
        // await runOmniScraper();

        // Por ahora, registrar que el cron se ejecutó correctamente
        console.log('[VENUZ CRON] Cron job executed successfully');
        console.log('[VENUZ CRON] To run scrapers manually: node scripts/scraper.js');

        const duration = (Date.now() - startTime) / 1000;

        return NextResponse.json({
            success: true,
            message: 'Cron job executed. Scrapers must be run manually.',
            manual_command: 'node scripts/scraper.js',
            duration: `${duration}s`,
            timestamp: new Date().toISOString(),
        });

    } catch (error: any) {
        console.error('[VENUZ CRON] Error:', error.message);

        return NextResponse.json({
            success: false,
            error: error.message,
        }, { status: 500 });
    }
}

// También soportar POST para compatibilidad
export async function POST(request: NextRequest) {
    return GET(request);
}
