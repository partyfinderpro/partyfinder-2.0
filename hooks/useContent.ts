'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getRecommendedContent } from '@/lib/recommendations';
import { useSession } from '@/components/AuthProvider';
import { filterFeedContent } from '@/lib/feed-filters';

// ============================================
// VENUZ - Hook para obtener contenido de Supabase
// FILTRO DE CALIDAD ACTIVADO: Bloquea ThePornDude y basura
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
}

interface UseContentOptions {
    category?: string;
    mode?: 'inicio' | 'tendencias' | 'cerca' | 'favoritos';
    city?: string;
    search?: string;
    limit?: number;
    offset?: number;
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
    const { category, mode = 'inicio', city, search, limit = 20, offset: initialOffset = 0 } = options;
    const session = useSession();
    const userId = session?.user?.id || (typeof window !== 'undefined' ? localStorage.getItem('venuz_user_id') : null);

    const [content, setContent] = useState<ContentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(initialOffset);
    const [totalCount, setTotalCount] = useState(0);

    const processResults = useCallback((data: ContentItem[], count: number, append: boolean) => {
        if (data && data.length > 0) {
            // 🔥 FILTRO DE CALIDAD: Eliminar basura de ThePornDude
            const filteredData = filterFeedContent(data);
            console.log(`[VENUZ Legacy] Filtered ${data.length - filteredData.length} junk items`);

            const normalizedData = filteredData.map(item => ({
                ...item,
                image_url: item.image_url || (item.images && item.images.length > 0 ? item.images[0] : undefined)
            }));

            if (append) {
                setContent(prev => [...prev, ...normalizedData]);
            } else {
                setContent(normalizedData);
            }

            setTotalCount(count);
            setHasMore(data.length >= limit);
        } else if (!append) {
            setContent([]);
            setHasMore(false);
            setTotalCount(0);
        }
    }, [limit]);

    const fetchContent = useCallback(async (currentOffset: number, append: boolean = false) => {
        setIsLoading(true);
        setError(null);

        try {
            let data: ContentItem[] = [];
            let count = 0;

            let query = supabase.from('content').select('*', { count: 'exact' });

            // 1. Filtro por Búsqueda (Texto)
            if (search) {
                query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
            }

            // 2. Filtro por Ciudad (Localización)
            if (city && city !== 'Todas') {
                query = query.ilike('location', `%${city}%`);
            }

            // 3. Lógica de filtrado según el modo o categoría
            if (category) {
                query = query.eq('category', category)
                    .order('is_premium', { ascending: false })
                    .order('created_at', { ascending: false });
            }
            else if (mode === 'tendencias') {
                query = query.order('views', { ascending: false }).order('likes', { ascending: false });
            }
            else if (mode === 'favoritos' && userId) {
                const { data: interactions } = await supabase
                    .from('interactions')
                    .select('content_id')
                    .eq('user_id', userId)
                    .eq('action', 'like');

                if (interactions && interactions.length > 0) {
                    const ids = interactions.map(i => i.content_id);
                    query = query.in('id', ids);
                } else {
                    if (!append) setContent([]);
                    setHasMore(false);
                    setIsLoading(false);
                    return;
                }
            }
            else {
                if (!search && !city && !category && mode === 'inicio') {
                    const { count: realCount } = await supabase.from('content').select('*', { count: 'exact', head: true });
                    data = await getRecommendedContent(userId || undefined, limit, currentOffset) as ContentItem[];
                    count = realCount || data.length;

                    processResults(data, count, append);
                    return;
                }

                query = query.order('created_at', { ascending: false });
            }

            const { data: finalData, error: fetchError, count: total } = await query.range(currentOffset, currentOffset + limit - 1);

            if (fetchError) throw fetchError;
            processResults(finalData as ContentItem[], total || 0, append);

        } catch (err: any) {
            console.error('[VENUZ] Error fetching content:', err);
            setError(`Error al cargar contenido`);
        } finally {
            setIsLoading(false);
        }
    }, [category, mode, city, search, limit, userId, processResults]);

    // Initial fetch
    useEffect(() => {
        setOffset(0);
        fetchContent(0, false);
    }, [category, mode, city, search, fetchContent]);

    // Load more
    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return;

        const newOffset = offset + limit;
        setOffset(newOffset);
        await fetchContent(newOffset, true);
    }, [isLoading, hasMore, offset, limit, fetchContent]);

    // Refresh
    const refresh = useCallback(async () => {
        setOffset(0);
        await fetchContent(0, false);
    }, [fetchContent]);

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
