import { NextRequest, NextResponse } from 'next/server';
import {
    getRecommendedFeed,
    getTrendingFeed,
    getNearbyFeed,
    getWebcamsFeed,
    getClubsFeed,
    getEscortsFeed,
} from '@/lib/feedAlgorithm';
import { createClient } from '@supabase/supabase-js';

// Supabase client para tracking
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================
// CACHE EN MEMORIA
// ============================================
interface CacheEntry {
    data: any;
    timestamp: number;
}

const feedCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCached(key: string): any | null {
    const entry = feedCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        feedCache.delete(key);
        return null;
    }
    return entry.data;
}

function setCache(key: string, data: any): void {
    feedCache.set(key, { data, timestamp: Date.now() });
}

// ============================================
// GET /api/feed
// ============================================
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const feedType = searchParams.get('type') || 'trending';
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');
        const userId = searchParams.get('userId') || undefined;
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        const category = searchParams.get('category') || undefined;
        const excludeIds = searchParams.get('exclude')?.split(',').filter(Boolean) || [];

        const cacheKey = `feed:${feedType}:${category || 'all'}:${limit}:${offset}`;

        // Check cache (solo para feeds anónimos sin offset)
        if (!userId && offset === 0 && excludeIds.length === 0) {
            const cached = getCached(cacheKey);
            if (cached) {
                return NextResponse.json({
                    success: true,
                    data: cached,
                    cached: true,
                    meta: { type: feedType, count: cached.length, limit, offset, hasMore: cached.length === limit },
                    timestamp: new Date().toISOString(),
                });
            }
        }

        let feed;
        switch (feedType) {
            case 'nearby':
                if (!lat || !lng) {
                    return NextResponse.json(
                        { success: false, error: 'lat y lng requeridos para feed nearby' },
                        { status: 400 }
                    );
                }
                feed = await getNearbyFeed(parseFloat(lat), parseFloat(lng), limit);
                break;

            case 'webcams':
                feed = await getWebcamsFeed(limit);
                break;

            case 'clubs':
                feed = await getClubsFeed(limit);
                break;

            case 'escorts':
                feed = await getEscortsFeed(limit);
                break;

            case 'personalized':
                if (!userId) {
                    return NextResponse.json(
                        { success: false, error: 'userId requerido para feed personalizado' },
                        { status: 400 }
                    );
                }
                feed = await getRecommendedFeed({ userId, limit, offset, excludeIds, filterCategory: category });
                break;

            case 'trending':
            default:
                feed = await getRecommendedFeed({ limit, offset, excludeIds, filterCategory: category });
                break;
        }

        // Cache el resultado
        if (!userId && offset === 0 && excludeIds.length === 0) {
            setCache(cacheKey, feed);
        }

        return NextResponse.json({
            success: true,
            data: feed,
            meta: {
                type: feedType,
                count: feed.length,
                limit,
                offset,
                hasMore: feed.length === limit,
            },
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Feed API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Error al cargar feed' },
            { status: 500 }
        );
    }
}

// ============================================
// POST /api/feed - Tracking
// ============================================
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { contentId, action, userId } = body;

        if (!contentId || !action) {
            return NextResponse.json(
                { success: false, error: 'contentId y action requeridos' },
                { status: 400 }
            );
        }

        // Registrar interacción
        if (action === 'view') {
            await supabase.rpc('increment_content_views', { p_id: contentId });
        } else if (action === 'like' && userId) {
            await supabase.rpc('toggle_content_like', {
                p_user_id: userId,
                p_content_id: contentId
            });
        }

        // También guardar en tabla de interacciones
        await supabase.from('user_interactions').insert({
            user_id: userId || null,
            content_id: contentId,
            action_type: action,
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Interaction Error:', error);
        return NextResponse.json(
            { success: false, error: 'Error al registrar interacción' },
            { status: 500 }
        );
    }
}
