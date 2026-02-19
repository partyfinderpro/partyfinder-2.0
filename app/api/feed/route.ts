import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase client from env variables
function getFallbackSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    // Normalizar contexto del usuario
    const lat = parseFloat(searchParams.get('lat') || '') || undefined;
    const lng = parseFloat(searchParams.get('lng') || '') || undefined;
    const userId = searchParams.get('user_id') || undefined;
    const city = searchParams.get('city') || 'cdmx';

    try {
        console.log('[Feed API] Calling Super Cerebro...');
        // Import dinámico para evitar problemas de build si el archivo no existiera todavía en tiempo de compilación inicial (opcional, pero buena práctica)
        const { generarFeed } = await import('@/lib/super-cerebro');

        const feed = await generarFeed(userId, (lat && lng) ? { lat, lng } : undefined);

        return NextResponse.json({
            success: true,
            data: feed,
            meta: {
                city,
                count: feed.length,
                source: 'super-cerebro-gemini',
                timestamp: new Date().toISOString()
            }
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0'
            }
        });

    } catch (error: any) {
        console.error('Super Cerebro Error, falling back to legacy:', error);

        // FALLBACK: Query directo a Supabase (Enhanced)
        try {
            const supabase = getFallbackSupabase();
            const pageSize = parseInt(searchParams.get('limit') || '20');
            const offset = parseInt(searchParams.get('offset') || '0');

            const category = searchParams.get('category');
            const mode = searchParams.get('mode');
            const search = searchParams.get('search');
            // Advanced filters
            const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
            const openNow = searchParams.get('openNow') === 'true';
            const priceMax = searchParams.get('priceMax');

            let query = supabase.from('content').select('*', { count: 'exact' });

            // 1. Search
            if (search) {
                query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
            }

            // 2. City logic (simplified for fallback)
            if (city && city !== 'Todas' && city !== 'Ubicación Actual') {
                query = query.ilike('location', `%${city}%`);
            }

            // 3. Category/Mode
            if (category) {
                query = query.eq('category', category);
            } else if (mode === 'tendencias') {
                // Simple trending logic for fallback
                query = query.order('views', { ascending: false });
            }

            // 4. Advanced Filters
            if (verifiedOnly) {
                query = query.eq('is_verified', true);
            }
            if (openNow) {
                query = query.eq('is_open_now', true);
            }
            // Add price filter if schema supports it

            // Standard ordering
            query = query.order('quality_score', { ascending: false })
                .order('created_at', { ascending: false })
                .range(offset, offset + pageSize - 1);

            const { data, error: dbError, count } = await query;

            if (dbError) throw dbError;

            return NextResponse.json({
                success: true,
                data: data || [],
                meta: {
                    source: 'legacy_fallback_enhanced',
                    count: count || 0
                }
            });

        } catch (fallbackError: any) {
            return NextResponse.json(
                { success: false, error: 'All feed methods failed' },
                { status: 500 }
            );
        }
    }
}

// POST para tracking de engagement
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            deviceId,
            itemId,
            categorySlug,
            sessionId,
            timeSpent,
            completionPct,
            clicked,
            saved,
            shared,
            userId
        } = body;

        if (!deviceId || !itemId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Usamos el módulo de tracking
        const { trackEngagement } = await import('@/lib/tracking');
        await trackEngagement({
            deviceId,
            itemId,
            categorySlug,
            sessionId,
            timeSpent: timeSpent || 0,
            completionPct: completionPct || 0,
            clicked: !!clicked,
            saved: !!saved,
            shared: !!shared,
            userId
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Tracking API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

