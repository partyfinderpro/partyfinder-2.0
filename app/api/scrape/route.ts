import { NextRequest, NextResponse } from 'next/server';

// v1.0.4 - API Route deshabilitada temporalmente
// El scraper usa CommonJS y causa conflictos con ESM en el build

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const authHeader = request.headers.get('authorization');

    console.log('--- SCRAPER API ROUTE ---');

    // Verificar la llave secreta
    const isAuthorized =
        (authHeader === `Bearer ${process.env.CRON_SECRET}`) ||
        (key && key === process.env.SCRAPER_API_KEY);

    if (!isAuthorized) {
        return NextResponse.json({
            error: 'Unauthorized',
            message: 'Credenciales inválidas'
        }, { status: 401 });
    }

    // Por ahora, retornamos un mensaje indicando que el scraper
    // debe ejecutarse manualmente via: node scripts/scraper.js
    return NextResponse.json({
        success: false,
        message: 'El scraper debe ejecutarse manualmente: node scripts/scraper.js',
        reason: 'ESM/CommonJS incompatibility in Vercel build'
    }, { status: 200 });
}
