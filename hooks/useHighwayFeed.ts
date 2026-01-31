'use client';

import { useState, useEffect, useCallback } from 'react';
import { isHighwayEnabled, debugFeatureFlags } from '@/lib/featureFlags';
import { getHighwayFeed, type HighwayContentItem } from '@/lib/highwayAlgorithm';
import { useUserIntent } from '@/hooks/useUserIntent';
import { assignVariant, trackHighwayAPICall } from '@/lib/abTestConfig';

// ============================================
// VENUZ - Hook para Highway Feed con Feature Flags
// Combina: Feature Flags + A/B Testing + User Intent
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

/**
 * Hook principal para obtener el feed con Highway Algorithm
 * 
 * Uso:
 * ```tsx
 * const { 
 *   feed, 
 *   isLoading,
 *   isHighwayActive,
 *   abVariant,
 *   intentScore,
 *   loadMore 
 * } = useHighwayFeed();
 * ```
 */
export function useHighwayFeed(options: UseHighwayFeedOptions = {}): UseHighwayFeedReturn {
    const { limit = 20, initialOffset = 0, location } = options;

    const [feed, setFeed] = useState<HighwayContentItem[]>([]);
    const [offset, setOffset] = useState(initialOffset);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isHighwayActive, setIsHighwayActive] = useState(false);
    const [abVariant, setAbVariant] = useState<string | null>(null);

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

        // Check if Highway is enabled for this user
        const highwayEnabled = isHighwayEnabled(userId || undefined);
        setIsHighwayActive(highwayEnabled);

        // Get A/B variant if enabled
        if (highwayEnabled && userId) {
            const variant = assignVariant(userId);
            setAbVariant(variant);
        }

        // Debug log in development
        if (process.env.NODE_ENV === 'development') {
            debugFeatureFlags(userId || undefined);
            console.log(`[Highway Feed] Active: ${highwayEnabled}, Variant: ${abVariant}`);
        }
    }, [getUserId, abVariant]);

    // Fetch feed
    const fetchFeed = useCallback(async (currentOffset: number, append: boolean = false) => {
        const userId = getUserId();

        if (!userId) {
            setIsLoading(false);
            return;
        }

        if (append) {
            setIsLoadingMore(true);
        } else {
            setIsLoading(true);
        }

        setError(null);

        try {
            const startTime = performance.now();

            // Fetch from Highway API
            const response = await getHighwayFeed({
                userId: isHighwayActive ? userId : undefined,
                intentScore: isHighwayActive ? intentScore : 0.5,  // Neutral if not active
                location,
                limit,
                offset: currentOffset,
            });

            const responseTime = performance.now() - startTime;

            // Track API call for analytics
            if (isHighwayActive) {
                trackHighwayAPICall(userId, responseTime, intentScore);
            }

            // Update state
            if (append) {
                setFeed(prev => [...prev, ...response]);
            } else {
                setFeed(response);
            }

            setHasMore(response.length >= limit);
            setOffset(currentOffset + response.length);

            if (process.env.NODE_ENV === 'development') {
                console.log(`[Highway Feed] Loaded ${response.length} items in ${responseTime.toFixed(0)}ms`);
            }

        } catch (err) {
            console.error('[Highway Feed] Error:', err);
            setError('Error loading feed');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [getUserId, isHighwayActive, intentScore, location, limit]);

    // Initial load
    useEffect(() => {
        if (!intentLoading) {
            fetchFeed(0, false);
        }
    }, [intentLoading, isHighwayActive, fetchFeed]);

    // Load more
    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;
        await fetchFeed(offset, true);
    }, [fetchFeed, offset, isLoadingMore, hasMore]);

    // Refresh
    const refresh = useCallback(async () => {
        setOffset(0);
        setHasMore(true);
        await fetchFeed(0, false);
    }, [fetchFeed]);

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
