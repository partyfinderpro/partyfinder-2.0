// app/api/debug/route.ts
// Herramienta de diagnóstico para verificar el estado real de la plataforma

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = createRouteHandlerClient({ cookies });
    const startTime = Date.now();

    try {
        // 1. Verificar conexión con Supabase
        const { data: content, count, error: dbError } = await supabase
            .from('content')
            .select('id, title, created_at, category', { count: 'exact' })
            .order('created_at', { ascending: false })
            .limit(5);

        if (dbError) throw dbError;

        // 2. Verificar sesión de usuario
        const { data: { session } } = await supabase.auth.getSession();

        // 3. Verificar última actividad de scraping
        // Intentamos buscar el registro más reciente
        const latestItem = content && content.length > 0 ? content[0] : null;

        const results = {
            status: 'success',
            timestamp: new Date().toISOString(),
            database: {
                total_items: count || 0,
                connection: 'established',
                latest_items: content,
                last_item_added: latestItem ? latestItem.created_at : 'none'
            },
            auth: {
                is_logged_in: !!session,
                user_email: session?.user?.email || 'anonymous'
            },
            environment: {
                node_version: process.version,
                vercel_region: process.env.VERCEL_REGION || 'local',
                has_cron_secret: !!process.env.CRON_SECRET,
                has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL
            },
            duration: `${Date.now() - startTime}ms`
        };

        return NextResponse.json(results);

    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
