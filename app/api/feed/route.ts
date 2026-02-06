import { NextRequest, NextResponse } from 'next/server';
import { HighwayAlgorithm, UserContext } from '@/lib/highway-v4';
import { createClient } from '@supabase/supabase-js';

// Fallback Supabase client - usando credenciales directas para garantizar conexión
const SUPABASE_URL = 'https://jbrmziwosyeructvlvrq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_emVwFBH19Vn54SrEegsWxg_WKU9MaHR';

function getFallbackSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY
    );
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    // Normalizar contexto del usuario
    const context: UserContext = {
        city: searchParams.get('city')?.toLowerCase() || 'cdmx',
        lat: parseFloat(searchParams.get('lat') || '') || undefined,
        lng: parseFloat(searchParams.get('lng') || '') || undefined,
        deviceId: searchParams.get('device_id') || 'anonymous',
        userId: searchParams.get('user_id') || undefined,
        sessionId: searchParams.get('session_id') || Date.now().toString()
    };

    const pageSize = parseInt(searchParams.get('limit') || '20');

    try {
        // Intentar Highway Algorithm primero
        const highway = new HighwayAlgorithm(context);
        const feed = await highway.generateFeed(pageSize);

        return NextResponse.json({
            success: true,
            data: feed,
            meta: {
                city: context.city,
                count: feed.length,
                source: 'highway',
                timestamp: new Date().toISOString()
            }
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0'
            }
        });

    } catch (highwayError: any) {
        console.error('Highway Feed Error, falling back to legacy:', highwayError.message);

        // FALLBACK: Query directo a Supabase si Highway falla
        try {
            const supabase = getFallbackSupabase();

            // Primer intento: con filtro active=true
            let { data, error } = await supabase
                .from('content')
                .select('*')
                .eq('active', true)
                .order('created_at', { ascending: false })
                .limit(pageSize);

            // Si no hay datos o hay error, intentar sin filtro active
            if (error || !data || data.length === 0) {
                console.warn('First fallback attempt failed or empty, trying without active filter');
                const result = await supabase
                    .from('content')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(pageSize);

                data = result.data;
                error = result.error;
            }

            if (error) throw error;

            return NextResponse.json({
                success: true,
                data: data || [],
                meta: {
                    city: context.city,
                    count: data?.length || 0,
                    source: 'legacy_fallback',
                    highway_error: highwayError.message,
                    timestamp: new Date().toISOString()
                }
            }, {
                headers: {
                    'Cache-Control': 'no-store, max-age=0'
                }
            });

        } catch (fallbackError: any) {
            console.error('Fallback also failed:', fallbackError.message);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Both Highway and fallback failed',
                    highway_error: highwayError.message,
                    fallback_error: fallbackError.message
                },
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

