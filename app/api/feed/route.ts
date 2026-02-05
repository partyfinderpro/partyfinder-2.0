import { NextRequest, NextResponse } from 'next/server';
import { HighwayAlgorithm, UserContext } from '@/lib/highway-v4';

export async function GET(request: NextRequest) {
    try {
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

        // Inicializar algoritmo
        const highway = new HighwayAlgorithm(context);

        // Generación de feed
        const feed = await highway.generateFeed(pageSize);

        return NextResponse.json({
            success: true,
            data: feed,
            meta: {
                city: context.city,
                count: feed.length,
                timestamp: new Date().toISOString()
            }
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0'
            }
        });


    } catch (error: any) {
        console.error('Highway Feed Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate feed: ' + error.message },
            { status: 500 }
        );
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

