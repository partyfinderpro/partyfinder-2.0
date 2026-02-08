'use client';

// ============================================
// VENUZ - Adaptive Feed Hook (FIXED - Race Condition Fix by Claude)
// Implementa lazy loading condicional para evitar race conditions
// ============================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useHighwayFeed } from '@/hooks/useHighwayFeed';
import { useContent, type ContentItem } from '@/hooks/useContent';
import { isHighwayEnabled } from '@/lib/featureFlags';

interface UseAdaptiveFeedOptions {
    category?: string;
    mode?: string;
    search?: string;
    city?: string;
    limit?: number;
    latitude?: number | null;
    longitude?: number | null;
    radius?: number;
    // Advanced Filters
    priceMin?: number;
    priceMax?: number;
    verifiedOnly?: boolean;
    openNow?: boolean;
}

/**
 * Hook wrapper que decide entre Highway y Legacy feed
 * 🔧 FIXED: Memoización + Auto-carga para garantizar mínimo de items
 */
export function useAdaptiveFeed(options: UseAdaptiveFeedOptions) {
    const { limit = 20 } = options;

    // 🔧 FIX 1: Memoizar userId para evitar recalculaciones
    const userId = useMemo(() => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('venuz_user_id');
    }, []);

    // 🔧 FIX 2: Memoizar la decisión del feature flag
    const highwayEnabled = useMemo(() => {
        return isHighwayEnabled(userId || undefined);
    }, [userId]);

    // 🔧 FIX 3: Estado para tracking de carga inicial
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 3;

    // Highway Feed (nuevo algoritmo)
    const highway = useHighwayFeed({
        limit: limit,
        // Pass location to highway algo
        location: (options.latitude && options.longitude) ? { lat: options.latitude, lng: options.longitude } : undefined
    });

    // Legacy Feed (feed actual)
    const legacy = useContent({
        category: options.category,
        mode: options.mode as any,
        search: options.search,
        city: options.city,
        limit: limit,
        // Pass location to useContent
        latitude: options.latitude,
        longitude: options.longitude,
        radius: options.radius,
        // Pass Advanced Filters
        priceMin: options.priceMin,
        priceMax: options.priceMax,
        verifiedOnly: options.verifiedOnly,
        openNow: options.openNow
    });

    // 🔧 FIX 4: Seleccionar el feed activo
    // Si hay una categoría seleccionada, usamos Legacy para garantizar el filtrado correcto
    // El modo Highway actualmente se enfoca en el "Main Feed" (mix de contenido)
    // También desactivamos Highway si hay búsqueda o filtros activos
    const hasActiveFilters = !!options.search || !!options.priceMax || !!options.verifiedOnly || !!options.openNow;
    const useHighwayNow = highwayEnabled && !options.category && !hasActiveFilters;

    const activeFeed = useHighwayNow ? {
        content: highway.feed as unknown as ContentItem[],
        isLoading: highway.isLoading,
        error: highway.error,
        hasMore: highway.hasMore,
        loadMore: highway.loadMore,
        refresh: highway.refresh,
    } : {
        content: legacy.content,
        isLoading: legacy.isLoading,
        error: legacy.error,
        hasMore: legacy.hasMore,
        loadMore: legacy.loadMore,
        refresh: legacy.refresh,
    };


    // 🔧 FIX 5: Garantizar mínimo de items
    const contentLength = activeFeed.content?.length || 0;
    const hasMinimumContent = contentLength >= 10; // Mínimo 10 items antes de mostrar

    // 🔧 FIX 6: Auto-cargar más si no hay suficiente contenido
    useEffect(() => {
        const shouldAutoLoad =
            !activeFeed.isLoading &&
            contentLength < 10 &&
            contentLength > 0 &&
            activeFeed.hasMore &&
            !initialLoadComplete &&
            retryCount < MAX_RETRIES;

        if (shouldAutoLoad) {
            console.log(`[VENUZ] Auto-loading more content (attempt ${retryCount + 1}). Current: ${contentLength}`);
            setRetryCount(prev => prev + 1);
            activeFeed.loadMore?.();
        } else if (contentLength >= 10 || (!activeFeed.hasMore && contentLength > 0)) {
            if (!initialLoadComplete) {
                console.log(`[VENUZ] Initial load complete with ${contentLength} items`);
                setInitialLoadComplete(true);
            }
        }
    }, [contentLength, activeFeed.isLoading, activeFeed.hasMore, initialLoadComplete, retryCount]);

    // 🔧 FIX 7: Retry automático si el feed está vacío
    const handleRefreshWithRetry = useCallback(async () => {
        setRetryCount(0);
        setInitialLoadComplete(false);
        await activeFeed.refresh?.();
    }, [activeFeed.refresh]);

    // Retornar el feed según el feature flag y el contexto
    if (useHighwayNow) {
        return {
            content: highway.feed as unknown as ContentItem[],
            isLoading: highway.isLoading || (!hasMinimumContent && highway.hasMore && retryCount < MAX_RETRIES),
            error: highway.error,
            hasMore: highway.hasMore,
            loadMore: highway.loadMore,
            refresh: handleRefreshWithRetry,
            totalCount: highway.feed?.length || 0,
            isHighwayActive: true,
            intentScore: highway.intentScore,
            abVariant: highway.abVariant,
            weights: highway.weights,
        };
    }


    return {
        content: legacy.content,
        isLoading: legacy.isLoading || (!hasMinimumContent && legacy.hasMore && retryCount < MAX_RETRIES),
        error: legacy.error,
        hasMore: legacy.hasMore,
        loadMore: legacy.loadMore,
        refresh: handleRefreshWithRetry,
        totalCount: legacy.totalCount,
        isHighwayActive: false,
        intentScore: 0.5,
        abVariant: null,
        weights: { wJob: 0.33, wEvent: 0.33, wAdult: 0.33 },
    };
}

export default useAdaptiveFeed;
