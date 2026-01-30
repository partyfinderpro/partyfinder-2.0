// app/api/go/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { injectAffiliateCode } from '@/lib/affiliateConfig';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * REDIRECT MANAGER (/api/go)
 * Este endpoint centraliza todas las salidas externas de la app.
 * Permite:
 * 1. Controlar el destino final.
 * 2. Inyectar códigos de afiliado al vuelo.
 * 3. Trackear clics (Analytics).
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('id');

    if (!contentId) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    try {
        // 1. Buscar en la base de datos
        const { data: item, error } = await supabase
            .from('content')
            .select('affiliate_url, source_url')
            .eq('id', contentId)
            .single();

        if (error || !item) {
            console.error('[Redirect] Content not found:', contentId);
            return NextResponse.redirect(new URL('/', request.url));
        }

        let targetUrl = item.affiliate_url || item.source_url;

        if (!targetUrl) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // 2. Lógica para saltar directorios (PornDude, etc)
        // Nota: El script de limpieza masiva se encargará de que targetUrl ya sea el dominio final.
        // Pero aquí por seguridad inyectamos el código de afiliado.

        const finalUrl = injectAffiliateCode(targetUrl);

        // 3. Log del clic (Opcional: podrías guardarlo en una tabla 'analytics_clicks')
        console.log(`[Redirect] Click on ${contentId} -> ${finalUrl}`);

        // 4. Redirección 303 (See Other) para evitar cacheo de redirección
        return NextResponse.redirect(finalUrl, { status: 303 });

    } catch (error) {
        console.error('[Redirect] Unexpected error:', error);
        return NextResponse.redirect(new URL('/', request.url));
    }
}
