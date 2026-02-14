
import { NextResponse } from 'next/server';
import { runDailyTour } from '@/lib/agents/venuz-core';

export const dynamic = 'force-dynamic'; // Asegura que no se cachee estáticamente

/**
 * Cron Job para invocar a VENUZ Core
 * Se debe configurar en Vercel Cron o llamar externamente.
 * 
 * URL: /api/cron/brain
 * Method: GET
 */
export async function GET(req: Request) {
    // Verificación simple de seguridad para cron (opcional, Vercel usa header propio tambien)
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) ...

    try {
        const { searchParams } = new URL(req.url);
        const mode = searchParams.get('mode') || 'auto'; // 'auto', 'morning', 'evening'

        console.log(`[CRON] Triggering VENUZ Core tour in mode: ${mode}`);
        const result = await runDailyTour(mode);

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
