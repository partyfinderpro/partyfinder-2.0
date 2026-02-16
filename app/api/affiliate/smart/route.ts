// app/api/affiliate/smart/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venue_id');
    const userIntent = searchParams.get('intent'); // ej: "party_high", "chill"

    if (!venueId) {
        return NextResponse.json({ url: 'https://venuz.app' }, { status: 400 });
    }

    try {
        // 1. Buscar link específico del venue con matching de intent
        let query = supabase
            .from('affiliate_links')
            .select('*')
            .eq('venue_id', venueId) // Prioridad: link específico del venue
            .eq('is_active', true)
            .order('priority', { ascending: false });

        if (userIntent) {
            // Si hay intent, filtrar o boostear (aquí simplificado: buscamos coincidencia exacta en array)
            // En PostgreSQL: intent_tags @> ARRAY[userIntent]
            // Como Supabase JS client filter es limitado para arrays, hacemos fetch y filtramos en memoria si son pocos
            // O usamos .contains('intent_tags', [userIntent])
            query = query.contains('intent_tags', [userIntent]);
        }

        const { data: links, error } = await query.limit(1);

        if (error) throw error;

        let targetUrl = 'https://venuz.app?ref=fallback';

        if (links && links.length > 0) {
            const link = links[0];

            // 2. Registrar Click (Async, no bloqueante)
            // Usamos RPC function para atomic increment
            await supabase.rpc('increment_affiliate_click', { link_id: link.id });
            targetUrl = link.url;
        }

        // 3. Redirección directa hacia el destino del afiliado
        const redirectUrl = new URL(targetUrl);
        // Añadir tracking params si es necesario
        redirectUrl.searchParams.set('utm_source', 'venuz_smart_engine');

        return NextResponse.redirect(redirectUrl.toString(), 302);

    } catch (err) {
        console.error('Error in smart affiliate redirect:', err);
        return NextResponse.redirect('https://venuz.app', 302);
    }
}
