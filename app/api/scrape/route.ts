import { NextRequest, NextResponse } from 'next/server';
const { runOmniScraper } = require('../../../scripts/scraper');

// v1.0.3 - TypeScript API Route to solve 404 on Vercel

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const authHeader = request.headers.get('authorization');

    console.log('--- GATILLO INICIADO: OMNI-SCRAPER ---');

    // Verificar variables de entorno críticas
    if (!process.env.CRON_SECRET && !process.env.SCRAPER_API_KEY) {
        console.error('⚠️ ALERTA: Faltan llaves de seguridad en el servidor (CRON_SECRET/SCRAPER_API_KEY)');
    }

    // Verificar la llave secreta (Bearer Token de Vercel Cron o Key manual)
    const isAuthorized =
        (authHeader === `Bearer ${process.env.CRON_SECRET}`) ||
        (key && key === process.env.SCRAPER_API_KEY);

    if (!isAuthorized) {
        console.warn('❌ Intento de ejecución no autorizado');
        return NextResponse.json({
            error: 'Unauthorized',
            message: 'Credenciales inválidas para ejecutar el scraper'
        }, { status: 401 });
    }

    try {
        console.log('🚀 Ejecutando agentes de recolección...');

        // Ejecutar el scraper
        const startTime = Date.now();
        await runOmniScraper();
        const duration = (Date.now() - startTime) / 1000;

        console.log(`✅ OMNI-SCRAPER finalizó exitosamente en ${duration}s`);

        return NextResponse.json({
            success: true,
            message: 'Omni-Scraper ejecutado con éxito (App Router TS)',
            duration: `${duration}s`
        }, { status: 200 });
    } catch (error: any) {
        console.error('💥 ERROR CRÍTICO EN SCRAPER:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
