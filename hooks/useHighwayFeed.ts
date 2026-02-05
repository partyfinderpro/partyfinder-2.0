'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { isHighwayEnabled, debugFeatureFlags } from '@/lib/featureFlags';
import { getHighwayFeed, type HighwayContentItem } from '@/lib/highwayAlgorithm';
import { useUserIntent } from '@/hooks/useUserIntent';
import { assignVariant, trackHighwayAPICall } from '@/lib/abTestConfig';
import { filterFeedContent } from '@/lib/feed-filters';

// ============================================
// VENUZ - Hook para Highway Feed con Feature Flags
// Combina: Feature Flags + A/B Testing + User Intent
// FILTRO DE CALIDAD MEJORADO: Recursive Fetching + SQL Filtering
// ============================================

interface UseHighwayFeedOptions {
    limit?: number;
    initialOffset?: number;
    location?: { lat: number; lng: number };
}

interface UseHighwayFeedReturn {
    feed: HighwayContentItem[];
    isLoading: boolean;
    isLoadingMore: boolean;
    error: string | null;
    hasMore: boolean;

    // Highway specific
    isHighwayActive: boolean;
    abVariant: string | null;
    intentScore: number;
    weights: { wJob: number; wEvent: number; wAdult: number };

    // Actions
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
}

export function useHighwayFeed(options: UseHighwayFeedOptions = {}): UseHighwayFeedReturn {
    const { limit = 20, initialOffset = 0, location } = options;

    const [feed, setFeed] = useState<HighwayContentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isHighwayActive, setIsHighwayActive] = useState(false);
    const [abVariant, setAbVariant] = useState<string | null>(null);

    // Track DB offset separately
    const dbOffsetRef = useRef(initialOffset);

    // User Intent hook
    const {
        intentScore,
        weights,
        isLoading: intentLoading,
    } = useUserIntent();

    // Get userId from localStorage
    const getUserId = useCallback((): string | null => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('venuz_user_id');
    }, []);

    // Check feature flags on mount
    useEffect(() => {
        const userId = getUserId();
        const highwayEnabled = isHighwayEnabled(userId || undefined);
        setIsHighwayActive(highwayEnabled);
        if (highwayEnabled && userId) {
            setAbVariant(assignVariant(userId));
        }
    }, [getUserId]);

    // Fetch batch function
    const fetchBatch = useCallback(async (currentOffset: number, batchSize: number) => {
        const userId = getUserId();
        if (!userId) return { data: [], error: null }; // Should handle anon?

        const startTime = performance.now();

        const response = await fetch(`/api/feed?device_id=${userId}&intent_score=${intentScore}&limit=${batchSize}&offset=${currentOffset}&city=${location?.lat ? 'geo' : 'cdmx'}&lat=${location?.lat || ''}&lng=${location?.lng || ''}`);
        const result = await response.json();

        const responseTime = performance.now() - startTime;
        if (isHighwayActive) trackHighwayAPICall(userId, responseTime, intentScore);

        return { data: result.data || [], error: result.error || null };

    }, [getUserId, isHighwayActive, intentScore, location]);

    // Recursive fetch until fulfilled
    const fetchUntilFulfilled = useCallback(async (targetCount: number, append: boolean) => {
        if (append) setIsLoadingMore(true);
        else setIsLoading(true);

        setError(null);

        const BATCH_SIZE = 40;
        let accumulatedItems: HighwayContentItem[] = [];
        let currentDbOffset = dbOffsetRef.current;
        let loops = 0;
        const MAX_LOOPS = 5;

        try {
            while (accumulatedItems.length < targetCount && loops < MAX_LOOPS) {
                const { data } = await fetchBatch(currentDbOffset, BATCH_SIZE);

                if (!data || data.length === 0) break;

                // Client-side filtering
                const validItems = filterFeedContent(data) as HighwayContentItem[];
                console.log(`[Highway Loop ${loops}] Raw: ${data.length}, Valid: ${validItems.length}`);

                accumulatedItems = [...accumulatedItems, ...validItems];
                currentDbOffset += data.length;
                loops++;
            }

            dbOffsetRef.current = currentDbOffset;

            if (append) {
                setFeed(prev => [...prev, ...accumulatedItems]);
            } else {
                setFeed(accumulatedItems);
            }

            setHasMore(accumulatedItems.length > 0); // Simplistic check

        } catch (err) {
            console.error('[Highway Feed] Error:', err);
            setError('Error loading feed');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [fetchBatch]);

    // Initial load
    useEffect(() => {
        if (!intentLoading) {
            dbOffsetRef.current = 0;
            fetchUntilFulfilled(limit, false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [intentLoading, isHighwayActive, limit]); // Removed recursive deps

    // Load more
    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;
        await fetchUntilFulfilled(limit, true);
    }, [isLoadingMore, hasMore, limit, fetchUntilFulfilled]);

    // Refresh
    const refresh = useCallback(async () => {
        dbOffsetRef.current = 0;
        setHasMore(true);
        await fetchUntilFulfilled(limit, false);
    }, [limit, fetchUntilFulfilled]);

    return {
        feed,
        isLoading,
        isLoadingMore,
        error,
        hasMore,
        isHighwayActive,
        abVariant,
        intentScore,
        weights,
        loadMore,
        refresh,
    };
}

export default useHighwayFeed;
