// app/api/go/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { injectAffiliateCode } from '@/lib/affiliateConfig';

// Lazy initialization para evitar errores en build time
let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
    if (!supabaseInstance) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

        supabaseInstance = createClient(url, key);
    }
    return supabaseInstance;
}

// Hash IP for privacy
function hashIP(ip: string): string {
    if (!ip) return '';
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
        const char = ip.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

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
        const supabase = getSupabase();

        // 1. Buscar en la base de datos
        const { data: item, error } = await supabase
            .from('content')
            .select('affiliate_url, source_url, affiliate_source')
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

        // 2. Inyectar código de afiliado
        const finalUrl = injectAffiliateCode(targetUrl);

        // 3. 📊 Trackear conversión (click)
        try {
            await supabase
                .from('affiliate_conversions')
                .insert({
                    content_id: contentId,
                    affiliate_source: item.affiliate_source || extractDomain(targetUrl),
                    event_type: 'click',
                    user_agent: request.headers.get('user-agent') || '',
                    ip_hash: hashIP(request.headers.get('x-forwarded-for') || ''),
                });
            console.log(`[Redirect] ✅ Click tracked: ${contentId} -> ${finalUrl}`);
        } catch (trackError) {
            // No fallar si el tracking falla
            console.error('[Redirect] Tracking error (non-fatal):', trackError);
        }

        // 4. Redirección 303 (See Other) para evitar cacheo de redirección
        return NextResponse.redirect(finalUrl, { status: 303 });

    } catch (error) {
        console.error('[Redirect] Unexpected error:', error);
        return NextResponse.redirect(new URL('/', request.url));
    }
}

// Extraer dominio de URL
function extractDomain(url: string): string {
    try {
        const domain = new URL(url).hostname.replace('www.', '');
        return domain;
    } catch {
        return 'unknown';
    }
}
