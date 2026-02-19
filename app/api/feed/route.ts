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
        let data: any[] = [];
        let count: number | null = 0;

        // Start building query (this will be used for non-Vallarta cities)
        let baseQuery = supabase
            .from('content')
            .select('*', { count: 'exact' })
            .eq('active', true)
            .not('image_url', 'is', null)
            .neq('image_url', '')

        // ── FILTRO CIUDAD DEFAULT: Puerto Vallarta (Enhanced) ──
        let textResults: any[] = [];
        let geoResults: any[] = [];

        if (!city || city === 'puerto-vallarta' || city.toLowerCase().includes('vallarta')) {
            // 1. Text Search Query
            const textQuery = supabase
                .from('content')
                .select('*')
                .eq('active', true)
                .not('image_url', 'is', null)
                .neq('image_url', '')
                .or('source_url.ilike.%vallarta%,location.ilike.%vallarta%')
                // Apply hygiene filters to text query too
                .not('source_url', 'ilike', '%reddit%')
                .not('source_url', 'ilike', '%theporndude%')
                .not('title', 'ilike', '%porn sites%')
                .not('title', 'ilike', '%sex cams%')
                .not('title', 'ilike', '%temblor%')
                .not('title', 'ilike', '%sismo%')
                .order('quality_score', { ascending: false })
                .limit(limit);

            const { data: tData } = await textQuery;
            textResults = tData || [];

            // 2. Geo Box Query (Vallarta Coordinates)
            // Lat: 20.5 to 20.8, Lng: -105.5 to -105.1
            const geoQuery = supabase
                .from('content')
                .select('*')
                .eq('active', true)
                .not('image_url', 'is', null)
                .neq('image_url', '')
                .gte('lat', 20.5)
                .lte('lat', 20.8)
                .gte('lng', -105.5)
                .lte('lng', -105.1)
                // Apply hygiene filters
                .not('source_url', 'ilike', '%reddit%')
                .not('source_url', 'ilike', '%theporndude%')
                .not('title', 'ilike', '%porn sites%')
                .not('title', 'ilike', '%sex cams%')
                .not('title', 'ilike', '%temblor%')
                .not('title', 'ilike', '%sismo%')
                .order('quality_score', { ascending: false })
                .limit(limit);

            const { data: gData } = await geoQuery;
            geoResults = gData || [];

            // Merge and Deduplicate
            const combined = [...textResults, ...geoResults];
            const uniqueMap = new Map();
            combined.forEach(item => {
                if (!uniqueMap.has(item.id)) {
                    uniqueMap.set(item.id, item);
                }
            });

            // Sort combined results
            const sortedUnique = Array.from(uniqueMap.values())
                .sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0));

            // Apply pagination after merge
            data = sortedUnique.slice(offset, offset + limit);
            count = uniqueMap.size; // Total unique found before pagination

        } else {
            // Non-Vallarta Query
            let query = supabase
                .from('content')
                .select('*', { count: 'exact' })
                .eq('active', true)
                .not('image_url', 'is', null)
                .neq('image_url', '')

            query = query.ilike('location', `%${city}%`)

            // Hygiene
            query = query.not('title', 'ilike', '%sex cams%')
            query = query.not('title', 'ilike', '%temblor%')
            query = query.not('title', 'ilike', '%sismo%')

            // ── FILTRO CATEGORÍA OPCIONAL ──
            if (category) {
                query = query.eq('category', category)
            }

            // ── ORDEN: reciente y calidad ──
            query = query
                .order('quality_score', { ascending: false })
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1)

            const { data: rawData, error, count: rawCount } = await query

            if (error) throw error
            data = rawData || []
            count = rawCount || 0
        }

        // SHARED MIXING LOGIC (Applied to both branches)
        // ── MEZCLA INTELIGENTE 2.0 (Incluye Escorts) ──
        const escorts = data.filter(item => item.category === 'escort')
        const webcams = data.filter(item => item.category === 'webcam')
        const places = data.filter(item => item.category !== 'webcam' && item.category !== 'escort')

        const mixed: any[] = []
        let ei = 0, wi = 0, pi = 0

        // Loop principal: Mientras haya contenido en CUALQUIERA de los buckets
        while (ei < escorts.length || wi < webcams.length || pi < places.length) {
            // Patrón de Mezcla: 2 Escorts -> 1 Webcam -> 3 Lugares

            // 1. Dos Escorts (High Value)
            if (ei < escorts.length) mixed.push(escorts[ei++])
            if (ei < escorts.length) mixed.push(escorts[ei++])

            // 2. Una Webcam (Live Action)
            if (wi < webcams.length) mixed.push(webcams[wi++])

            // 3. Tres Lugares (Contexto Local)
            if (pi < places.length) mixed.push(places[pi++])
            if (pi < places.length) mixed.push(places[pi++])
            if (pi < places.length) mixed.push(places[pi++])

            // Breaker de seguridad
            if (mixed.length >= data.length + 10) break;
        }

        return NextResponse.json({
            success: true,
            data: mixed,
            count: mixed.length,
            meta: {
                city: city || 'puerto-vallarta',
                total: count,
                breakdown: {
                    escorts: escorts.length,
                    webcams: webcams.length,
                    places: places.length
                }
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
