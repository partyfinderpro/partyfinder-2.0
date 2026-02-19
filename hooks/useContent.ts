'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getRecommendedContent } from '@/lib/recommendations';
import { useSession } from '@/components/AuthProvider';
import { filterFeedContent } from '@/lib/feed-filters';

// ============================================
// VENUZ - Hook para obtener contenido de Supabase
// FILTRO DE CALIDAD MEJORADO: Recursive Fetching + SQL Filtering
// ============================================

export interface ContentItem {
    id: string;
    title: string;
    description?: string;
    image_url?: string;
    images?: string[];
    video_url?: string;
    thumbnail_url?: string;
    category: string;
    subcategory?: string;
    location?: string;
    distance_km?: number;
    rating?: number;
    is_verified?: boolean;
    is_premium?: boolean;
    is_open_now?: boolean;
    open_until?: string;
    affiliate_url?: string;
    affiliate_source?: 'camsoda' | 'stripchat' | 'chaturbate' | 'other';
    views?: number;
    likes?: number;
    created_at?: string;
    tags?: string[];
    viewers_now?: number;
    source_url?: string;
    external_id?: string;

    // Dynamic Content Fields
    preview_video_url?: string;
    preview_type?: 'video' | 'gif' | 'iframe' | 'image' | 'embed';
    iframe_preview_url?: string;
    embed_code?: string;
    gallery_urls?: string[];
    official_website?: string;
    has_affiliate?: boolean;
    content_tier?: 'premium' | 'verified' | 'scraped';
    quality_score?: number;
    is_featured?: boolean;
}

interface UseContentOptions {
    category?: string;
    mode?: 'inicio' | 'tendencias' | 'cerca' | 'favoritos';
    city?: string;
    search?: string;
    limit?: number; // Target number of valid items
    offset?: number;
    latitude?: number | null;
    longitude?: number | null;
    radius?: number;
    // New Advanced Filters
    priceMin?: number;
    priceMax?: number;
    verifiedOnly?: boolean;
    openNow?: boolean;
}

interface UseContentReturn {
    content: ContentItem[];
    isLoading: boolean;
    error: string | null;
    hasMore: boolean;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
    totalCount: number;
}

export function useContent(options: UseContentOptions = {}): UseContentReturn {
    const {
        category,
        mode = 'inicio',
        city,
        search,
        limit = 20,
        offset: initialOffset = 0,
        priceMin,
        priceMax,
        verifiedOnly,
        openNow
    } = options;
    const session = useSession();
    const userId = session?.user?.id || (typeof window !== 'undefined' ? localStorage.getItem('venuz_user_id') : null);

    const [content, setContent] = useState<ContentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    // Track DB offset separately from UI items
    // Esto es crucial: 'dbOffset' rastrea cuántos items RAW hemos leído de Supabase
    const dbOffsetRef = useRef(initialOffset);

    // Resetear offset al cambiar filtros
    useEffect(() => {
        dbOffsetRef.current = 0;
    }, [category, mode, city, search, priceMin, priceMax, verifiedOnly, openNow]);

    // Updated to use server-side API
    const fetchBatch = useCallback(async (startOffset: number, batchSize: number) => {
        try {
            const params = new URLSearchParams();
            if (category) params.append('category', category);
            if (mode) params.append('mode', mode);
            if (city && city !== 'Todas') params.append('city', city);
            if (search) params.append('search', search);
            params.append('limit', batchSize.toString());
            params.append('offset', startOffset.toString());

            if (options.latitude) params.append('lat', options.latitude.toString());
            if (options.longitude) params.append('lng', options.longitude.toString());
            if (options.radius) params.append('radius', options.radius.toString());

            if (priceMin) params.append('priceMin', priceMin.toString());
            if (priceMax) params.append('priceMax', priceMax.toString());
            if (verifiedOnly) params.append('verifiedOnly', 'true');
            if (openNow) params.append('openNow', 'true');
            if (userId) params.append('user_id', userId);

            const response = await fetch(`/api/feed?${params.toString()}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch feed');
            }

            return {
                data: result.data as ContentItem[],
                error: null,
                count: result.meta?.count || 0
            };
        } catch (err: any) {
            console.error('[VENUZ] Error fetching feed from API:', err);
            return { data: [], error: err.message, count: 0 };
        }
    }, [category, mode, city, search, userId, options.latitude, options.longitude, options.radius, priceMin, priceMax, verifiedOnly, openNow]);

    // Función recursiva para llenar el 'bucket' de items válidos
    const fetchUntilFulfilled = useCallback(async (targetCount: number, append: boolean) => {
        setIsLoading(true);
        setError(null);

        try {
            // Simply call fetchBatch once since the API handles the heavy lifting now
            const { data, count } = await fetchBatch(dbOffsetRef.current, targetCount);

            if (append) {
                setContent(prev => [...prev, ...data]);
            } else {
                setContent(data);
            }

            setTotalCount(count);
            // Assuming API handles pagination correctly
            setHasMore(data.length === targetCount); // Simplification

        } catch (err: any) {
            console.error('[VENUZ] Error fetching content:', err);
            setError(`Error al cargar contenido`);
        } finally {
            setIsLoading(false);
        }
    }, [fetchBatch]);

    // Initial fetch - Ahora también se dispara cuando cambia la ubicación
    useEffect(() => {
        console.log('[VENUZ] Initial fetch triggered via API. Mode:', mode);
        setContent([]);
        dbOffsetRef.current = 0;
        fetchUntilFulfilled(limit, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category, mode, city, search, limit, options.latitude, options.longitude]);

    // Load more
    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return;
        dbOffsetRef.current += limit; // Increment offset
        await fetchUntilFulfilled(limit, true);
    }, [isLoading, hasMore, limit, fetchUntilFulfilled]);

    // Refresh - Limpia contenido
    const refresh = useCallback(async () => {
        console.log('[VENUZ] Refreshing feed...');
        setContent([]);
        setHasMore(true);
        dbOffsetRef.current = 0;
        await fetchUntilFulfilled(limit, false);
    }, [limit, fetchUntilFulfilled]);

    return {
        content,
        isLoading,
        error,
        hasMore,
        loadMore,
        refresh,
        totalCount,
    };
}

// Hook para obtener un item específico
export function useContentItem(id: string) {
    const [item, setItem] = useState<ContentItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchItem = async () => {
            setIsLoading(true);
            try {
                const { data, error: fetchError } = await supabase
                    .from('content')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (fetchError) throw fetchError;

                setItem(data as ContentItem);
            } catch (err) {
                console.error('[VENUZ] Error fetching item:', err);
                setError('Error al cargar contenido');
            } finally {
                setIsLoading(false);
            }
        };

        fetchItem();
    }, [id]);

    return { item, isLoading, error };
}

export default useContent;
