import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

export async function GET(request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        console.log('[CRON:CLEANUP] Iniciando limpieza de contenido antiguo...');

        // 1. Deactivar eventos pasados (donde end_time < NOW)
        const now = new Date().toISOString();
        const { count: deactivatedCount, error: deactivationError } = await supabase
            .from('content')
            .update({ active: false })
            .lt('end_time', now)
            .eq('active', true)
            .select('*', { count: 'exact', head: true });

        if (deactivationError) throw deactivationError;

        // 2. Eliminar contenido muy antiguo o basura (opcional)
        // Por ahora solo desactivamos.

        return NextResponse.json({
            success: true,
            timestamp: now,
            deactivated: deactivatedCount || 0
        });

    } catch (error) {
        console.error('[CRON:CLEANUP] Error:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
