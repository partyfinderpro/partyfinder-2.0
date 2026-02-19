import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use admin client if available, otherwise anon. 
// Ideally should use service role key for restricted data but anon works for public content if policies allow.
// Using SUPABASE_SERVICE_ROLE_KEY to ensure we can filter freely without RLS restrictions on public data.
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)

    const city = searchParams.get('city') || 'puerto-vallarta'
    const category = searchParams.get('category');
    const limitStr = searchParams.get('limit') || '50';
    const offsetStr = searchParams.get('offset') || '0';
    const limit = parseInt(limitStr);
    const offset = parseInt(offsetStr);

    try {
        // Start building query
        let query = supabase
            .from('content')
            .select('*', { count: 'exact' })
            .eq('active', true)
            .not('image_url', 'is', null)
            .neq('image_url', '')

        // ── FILTRO CIUDAD DEFAULT: Puerto Vallarta ──
        // Note: Checking strict string equality or containing 'vallarta'
        if (!city || city === 'puerto-vallarta' || city.toLowerCase().includes('vallarta')) {
            // Using .or() with standard Supabase syntax for "source_url contains 'vallarta' OR lat/lng in box"
            // The instruction provided "source_url.ilike.%vallarta%," which is correct postgrest syntax usually passed to .or()
            query = query.or(
                'source_url.ilike.%vallarta%,location.ilike.%vallarta%'
            )
            // Note: Adding lat/lng filter in .or() can be tricky if columns key existence isn't guaranteed or types mismatch.
            // For safety in this "emergency fix", we stick to text search on source_url/location which is safer.
            // If you are sure about lat/lng columns:
            // query = query.or('source_url.ilike.%vallarta%,and(lat.gte.20.5,lat.lte.20.8,lng.gte.-105.5,lng.lte.-105.1)')
        } else {
            // If another city is requested
            query = query.ilike('location', `%${city}%`)
        }

        // ── HIGIENE: Sacar Reddit del feed principal (y otros indeseados) ──
        // Using filter chaining which acts as AND
        query = query.not('source_url', 'ilike', '%reddit%')
        query = query.not('source_url', 'ilike', '%theporndude%')
        query = query.not('title', 'ilike', '%porn sites%')
        query = query.not('title', 'ilike', '%sex cams%')
        query = query.not('title', 'ilike', '%temblor%')
        query = query.not('title', 'ilike', '%sismo%')

        // ── FILTRO CATEGORÍA OPCIONAL ──
        if (category) {
            query = query.eq('category', category)
        }

        // ── ORDEN: reciente y calidad ──
        // We fetch a bit more to handle the manual mixing if needed, or just respect limit
        query = query
            .order('quality_score', { ascending: false })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        const { data: rawData, error, count } = await query

        if (error) throw error

        const data = rawData || []

        // ── MEZCLA INTELIGENTE: intercalar webcams con lugares (Simulated) ──
        // This logic replaces the "Highway" partially on the frontend side for now
        const webcams = data.filter(item => item.category === 'webcam')
        const places = data.filter(item => item.category !== 'webcam')

        // Simple mixing logic: 1 webcam every 4 places
        const mixed: any[] = []
        let wi = 0
        let pi = 0

        while (pi < places.length || wi < webcams.length) {
            // Add up to 4 places
            for (let i = 0; i < 4 && pi < places.length; i++) {
                mixed.push(places[pi++]);
            }
            // Add 1 webcam if available
            if (wi < webcams.length) {
                mixed.push(webcams[wi++]);
            }
            // If no places left but webcams exist, add remaining webcams
            if (pi >= places.length && wi < webcams.length) {
                mixed.push(...webcams.slice(wi));
                break;
            }
        }

        return NextResponse.json({
            success: true, // Frontend might expect this based on previous codebase
            data: mixed,
            count: mixed.length,
            meta: {
                city: city || 'puerto-vallarta',
                total: count
            }
        })

    } catch (error: any) {
        console.error('Feed API error:', error)
        return NextResponse.json({
            success: false,
            error: error.message || 'Error loading feed',
            data: [],
            count: 0
        }, { status: 500 })
    }
}
