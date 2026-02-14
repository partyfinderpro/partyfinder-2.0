import { NextRequest, NextResponse } from 'next/server';
import { HighwayAlgorithm, UserContext } from '@/lib/highway-v4';
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

        // FALLBACK: Query directo a Supabase
        try {
            const supabase = getFallbackSupabase();
            const pageSize = parseInt(searchParams.get('limit') || '20');

            const { data, error: dbError } = await supabase
                .from('content')
                .select('*')
                .eq('active', true)
                .order('quality_score', { ascending: false })
                .limit(pageSize);

            if (dbError) throw dbError;

            return NextResponse.json({
                success: true,
                data: data || [],
                meta: {
                    source: 'legacy_fallback',
                    error: error.message
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

