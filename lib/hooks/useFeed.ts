'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ContentItem } from '@/lib/feedAlgorithm';

interface UseFeedOptions {
    type?: 'trending' | 'nearby' | 'webcams' | 'clubs' | 'escorts' | 'personalized';
    userId?: string;
    lat?: number;
    lng?: number;
    limit?: number;
    category?: string;
}

interface UseFeedReturn {
    items: ContentItem[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    loadMore: () => void;
    refresh: () => void;
}

export function useFeed(options: UseFeedOptions = {}): UseFeedReturn {
    const {
        type = 'trending',
        userId,
        lat,
        lng,
        limit = 20,
        category,
    } = options;

    const [items, setItems] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const loadedIdsRef = useRef<Set<string>>(new Set());

    const fetchFeed = useCallback(async (isRefresh = false) => {
        try {
            setLoading(true);
            setError(null);

            const currentOffset = isRefresh ? 0 : offset;
            const excludeIds = isRefresh ? [] : Array.from(loadedIdsRef.current);

            const params = new URLSearchParams({
                type,
                limit: limit.toString(),
                offset: currentOffset.toString(),
            });

            if (userId) params.set('userId', userId);
            if (lat && lng) {
                params.set('lat', lat.toString());
                params.set('lng', lng.toString());
            }
            if (category) params.set('category', category);
            if (excludeIds.length > 0) {
                params.set('exclude', excludeIds.join(','));
            }

            const response = await fetch(`/api/feed?${params}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Error desconocido');
            }

            const newItems: ContentItem[] = result.data;

            newItems.forEach(item => loadedIdsRef.current.add(item.id));

            if (isRefresh) {
                setItems(newItems);
                setOffset(newItems.length);
                loadedIdsRef.current = new Set(newItems.map(i => i.id));
            } else {
                setItems(prev => [...prev, ...newItems]);
                setOffset(prev => prev + newItems.length);
            }

            setHasMore(result.meta.hasMore);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar feed');
        } finally {
            setLoading(false);
        }
    }, [type, userId, lat, lng, limit, offset, category]);

    useEffect(() => {
        loadedIdsRef.current.clear();
        setItems([]);
        setOffset(0);
        setHasMore(true);
        fetchFeed(true);
    }, [type, userId, lat, lng, category]);

    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            fetchFeed(false);
        }
    }, [loading, hasMore, fetchFeed]);

    const refresh = useCallback(() => {
        loadedIdsRef.current.clear();
        setItems([]);
        setOffset(0);
        setHasMore(true);
        fetchFeed(true);
    }, [fetchFeed]);

    return {
        items,
        loading,
        error,
        hasMore,
        loadMore,
        refresh,
    };
}

// ============================================
// Hook para Intersection Observer (infinite scroll)
// ============================================
export function useInfiniteScroll(
    callback: () => void,
    hasMore: boolean,
    loading: boolean
) {
    const observerRef = useRef<IntersectionObserver | null>(null);
    const triggerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (loading || !hasMore) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    callback();
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        if (triggerRef.current) {
            observerRef.current.observe(triggerRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [callback, hasMore, loading]);

    return triggerRef;
}

// ============================================
// Hook para trackear interacciones
// ============================================
export function useTrackInteraction() {
    const trackView = useCallback(async (contentId: string) => {
        try {
            await fetch('/api/feed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contentId,
                    action: 'view',
                }),
            });
        } catch (err) {
            console.error('Error tracking view:', err);
        }
    }, []);

    const trackLike = useCallback(async (contentId: string) => {
        try {
            await fetch('/api/feed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contentId,
                    action: 'like',
                }),
            });
        } catch (err) {
            console.error('Error tracking like:', err);
        }
    }, []);

    return { trackView, trackLike };
}
