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
}

interface UseContentOptions {
    category?: string;
    mode?: 'inicio' | 'tendencias' | 'cerca' | 'favoritos';
    city?: string;
    search?: string;
    limit?: number; // Target number of valid items
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
    const [totalCount, setTotalCount] = useState(0);

    // Track DB offset separately from UI items
    // Esto es crucial: 'dbOffset' rastrea cuántos items RAW hemos leído de Supabase
    const dbOffsetRef = useRef(initialOffset);

    // Resetear offset al cambiar filtros
    useEffect(() => {
        dbOffsetRef.current = 0;
    }, [category, mode, city, search]);

    const fetchBatch = useCallback(async (startOffset: number, batchSize: number) => {
        let query = supabase.from('content').select('*', { count: 'exact' });

        // 1. Filtro por Búsqueda (Texto)
        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
        }

        // 2. Filtro por Ciudad (Localización)
        if (city && city !== 'Todas') {
            query = query.ilike('location', `%${city}%`);
        }

        // 3. Filtros SQL de Calidad (Bloquear basura en origen para ahorrar ancho de banda)
        query = query.not('source_url', 'ilike', '%theporndude%')
            .not('title', 'ilike', '%porn sites%')
            .not('title', 'ilike', '%sex cams%');

        // 4. Lógica de filtrado según el modo o categoría
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
                return { data: [], count: 0, error: null };
            }
        }
        else {
            if (!search && !city && !category && mode === 'inicio') {
                // Para 'inicio', usamos lógica especial o ordenamiento por defecto
                // TODO: Integrar getRecommendedContent si se requiere híbrido real aquí
                query = query.order('created_at', { ascending: false });
            } else {
                query = query.order('created_at', { ascending: false });
            }
        }

        const { data, error, count } = await query.range(startOffset, startOffset + batchSize - 1);
        return { data: data as ContentItem[], error, count };

    }, [category, mode, city, search, userId]);

    // Función recursiva para llenar el 'bucket' de items válidos
    const fetchUntilFulfilled = useCallback(async (targetCount: number, append: boolean) => {
        setIsLoading(true);
        setError(null);

        const BATCH_SIZE = 50; // Leemos más items para compensar el filtrado
        let accumulatedItems: ContentItem[] = [];
        let currentDbOffset = dbOffsetRef.current;
        let loops = 0;
        const MAX_LOOPS = 5; // Evitar loops infinitos si todo es basura
        let totalDBCount = 0;

        try {
            while (accumulatedItems.length < targetCount && loops < MAX_LOOPS) {
                const { data, error: fetchError, count } = await fetchBatch(currentDbOffset, BATCH_SIZE);

                if (fetchError) throw fetchError;

                totalDBCount = count || 0;

                if (!data || data.length === 0) {
                    break; // No hay más datos en DB
                }

                // Filtrar basura client-side (doble check)
                const validItems = filterFeedContent(data);

                // Normalizar imágenes
                const normalizedItems = validItems.map(item => ({
                    ...item,
                    image_url: item.image_url || (item.images && item.images.length > 0 ? item.images[0] : undefined)
                }));

                accumulatedItems = [...accumulatedItems, ...normalizedItems];
                currentDbOffset += data.length; // Avanzamos el offset real de la DB
                loops++;
            }

            // Actualizar referencia de offset para la próxima vez
            dbOffsetRef.current = currentDbOffset;

            console.log(`[VENUZ Fetch] Loop finished. Requested: ${targetCount}, Got: ${accumulatedItems.length}, Loops: ${loops}`);

            if (append) {
                setContent(prev => [...prev, ...accumulatedItems]);
            } else {
                setContent(accumulatedItems);
            }

            setTotalCount(totalDBCount);
            // Si trajimos menos items de los pedidos en el último batch crudo, es que se acabó la DB
            // O si el count total es menor o igual al offset actual
            setHasMore(currentDbOffset < totalDBCount);

        } catch (err: any) {
            console.error('[VENUZ] Error fetching content:', err);
            setError(`Error al cargar contenido`);
        } finally {
            setIsLoading(false);
        }
    }, [fetchBatch]);

    // Initial fetch
    useEffect(() => {
        setContent([]);
        dbOffsetRef.current = 0;
        fetchUntilFulfilled(limit, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category, mode, city, search, limit]); // Removed fetchUntilFulfilled to avoid recursive deps if not memoized deeply

    // Load more
    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return;
        console.log('[VENUZ] Loading more... current db offset:', dbOffsetRef.current);
        await fetchUntilFulfilled(limit, true);
    }, [isLoading, hasMore, limit, fetchUntilFulfilled]);

    // Refresh
    const refresh = useCallback(async () => {
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
