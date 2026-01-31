import { NextRequest, NextResponse } from 'next/server';
import {
    getHighwayFeed,
    getUserIntent,
    createUserIntent,
    updateUserIntentOnInteraction,
    calculatePillarWeights,
    type ContentPillar,
} from '@/lib/highwayAlgorithm';

// ============================================
// VENUZ Highway API - El corazón del algoritmo
// ============================================

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        const intentOverride = searchParams.get('intent');  // Para testing

        // Location opcional
        const location = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined;

        // Intent override para debugging
        const intentScore = intentOverride ? parseFloat(intentOverride) : undefined;

        // Obtener feed personalizado
        const feed = await getHighwayFeed({
            userId: userId || undefined,
            intentScore,
            location,
            limit,
            offset,
        });

        // Obtener intent actual y weights para el frontend
        let currentIntent = null;
        let weights = calculatePillarWeights(0.5);

        if (userId) {
            currentIntent = await getUserIntent(userId);
            if (currentIntent) {
                weights = calculatePillarWeights(currentIntent.intentScore);
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                feed,
                meta: {
                    total: feed.length,
                    offset,
                    limit,
                    hasMore: feed.length >= limit,
                },
                intent: currentIntent ? {
                    score: currentIntent.intentScore,
                    referrer: currentIntent.initialReferrer,
                    likes: {
                        job: currentIntent.likesJob,
                        event: currentIntent.likesEvent,
                        adult: currentIntent.likesAdult,
                    },
                } : null,
                weights: {
                    job: Math.round(weights.wJob * 100),
                    event: Math.round(weights.wEvent * 100),
                    adult: Math.round(weights.wAdult * 100),
                },
            },
        });

    } catch (error) {
        console.error('[Highway API] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Error fetching highway feed' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, userId, contentId, pillar, referrer, location } = body;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'userId is required' },
                { status: 400 }
            );
        }

        switch (action) {
            case 'initialize': {
                // Inicializar intent para nuevo usuario
                const intent = await createUserIntent(
                    userId,
                    referrer || 'direct',
                    location
                );

                return NextResponse.json({
                    success: true,
                    data: {
                        intent: {
                            score: intent.intentScore,
                            referrer: intent.initialReferrer,
                        },
                        weights: calculatePillarWeights(intent.intentScore),
                    },
                });
            }

            case 'view':
            case 'like': {
                // Actualizar intent basado en interacción
                if (!pillar || !['job', 'event', 'adult'].includes(pillar)) {
                    return NextResponse.json(
                        { success: false, error: 'Valid pillar is required (job, event, adult)' },
                        { status: 400 }
                    );
                }

                const newScore = await updateUserIntentOnInteraction(
                    userId,
                    action as 'view' | 'like',
                    pillar as ContentPillar
                );

                const newWeights = calculatePillarWeights(newScore);

                // Log especial para el tercer like de evento
                if (action === 'like' && pillar === 'event') {
                    const intent = await getUserIntent(userId);
                    if (intent && intent.likesEvent === 3) {
                        console.log(`[Highway API] 🔥 User ${userId} hit THIRD EVENT LIKE! Injecting adult content...`);
                    }
                }

                return NextResponse.json({
                    success: true,
                    data: {
                        newScore,
                        weights: {
                            job: Math.round(newWeights.wJob * 100),
                            event: Math.round(newWeights.wEvent * 100),
                            adult: Math.round(newWeights.wAdult * 100),
                        },
                        message: action === 'like'
                            ? `Intent updated after ${pillar} like`
                            : `Intent updated after ${pillar} view`,
                    },
                });
            }

            case 'get': {
                // Solo obtener intent actual
                const intent = await getUserIntent(userId);

                if (!intent) {
                    return NextResponse.json({
                        success: true,
                        data: { intent: null, weights: calculatePillarWeights(0.5) },
                    });
                }

                return NextResponse.json({
                    success: true,
                    data: {
                        intent: {
                            score: intent.intentScore,
                            referrer: intent.initialReferrer,
                            likes: {
                                job: intent.likesJob,
                                event: intent.likesEvent,
                                adult: intent.likesAdult,
                            },
                            views: intent.totalViews,
                        },
                        weights: calculatePillarWeights(intent.intentScore),
                    },
                });
            }

            default:
                return NextResponse.json(
                    { success: false, error: `Unknown action: ${action}` },
                    { status: 400 }
                );
        }

    } catch (error) {
        console.error('[Highway API] POST Error:', error);
        return NextResponse.json(
            { success: false, error: 'Error processing intent action' },
            { status: 500 }
        );
    }
}

// ============================================
// Debug endpoint (solo en desarrollo)
// ============================================

export async function OPTIONS(request: NextRequest) {
    // Simular diferentes intent scores para debugging
    const scores = [0, 0.3, 0.5, 0.7, 1.0];

    const simulations = scores.map(score => ({
        score,
        weights: calculatePillarWeights(score),
        description: score === 0 ? 'Cold (Job Seeker)'
            : score < 0.4 ? 'Warming up'
                : score < 0.6 ? 'Engaged'
                    : score < 0.8 ? 'Hot'
                        : 'Ready for Adult',
    }));

    return NextResponse.json({
        message: 'Highway Algorithm Simulation',
        formula: 'w_job = (1-s)², w_event = 2s(1-s), w_adult = s²',
        simulations,
    });
}
