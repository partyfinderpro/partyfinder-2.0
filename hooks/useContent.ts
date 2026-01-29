'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getRecommendedContent } from '@/lib/recommendations';
import { useSession } from '@/components/AuthProvider';

// ============================================
// VENUZ - Hook para obtener contenido de Supabase
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

// Mock data como fallback si no hay datos en Supabase
const FALLBACK_CONTENT: ContentItem[] = [
    {
        id: "1",
        title: "Noche Latina @ Club Mandala",
        description: "La mejor fiesta latina de Puerto Vallarta con DJ internacional",
        image_url: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80",
        category: "club",
        location: "Zona Romántica",
        distance_km: 1.2,
        is_verified: true,
        is_open_now: true,
        open_until: "4:00 AM",
        views: 1523,
        likes: 234,
    },
    {
        id: "2",
        title: "Sofia - Modelo Premium",
        description: "Servicio VIP disponible 24/7. Fotos verificadas.",
        image_url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80",
        category: "escort",
        location: "Hotel Zone",
        distance_km: 0.8,
        is_verified: true,
        is_premium: true,
        views: 3421,
        likes: 567,
    }
];

export function useContent(options: UseContentOptions = {}): UseContentReturn {
    const { category, limit = 20, offset: initialOffset = 0 } = options;
    const session = useSession();
    const userId = session?.user?.id;

    const [content, setContent] = useState<ContentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(initialOffset);
    const [totalCount, setTotalCount] = useState(0);

    // Fetch content (usando el algoritmo de recomendaciones si no hay categoría específica)
    const fetchContent = useCallback(async (currentOffset: number, append: boolean = false) => {
        setIsLoading(true);
        setError(null);

        try {
            let data: ContentItem[] = [];
            let count = 0;

            if (category) {
                // Si hay categoría, usar filtro normal
                const { data: catData, error: fetchError, count: total } = await supabase
                    .from('content')
                    .select('*', { count: 'exact' })
                    .eq('category', category)
                    .order('created_at', { ascending: false })
                    .range(currentOffset, currentOffset + limit - 1);

                if (fetchError) throw fetchError;
                data = catData as ContentItem[];
                count = total || 0;
            } else {
                // Si es el feed principal, usar algoritmo de recomendaciones de Grok
                const { count: realCount } = await supabase.from('content').select('*', { count: 'exact', head: true });
                data = await getRecommendedContent(userId, limit, currentOffset) as ContentItem[];
                count = realCount || data.length;
            }

            // Check if we got data
            if (data && data.length > 0) {
                // Normalize data: ensure image_url is populated if images exists
                const normalizedData = data.map(item => ({
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
                // Fallback a los datos mock si nada funciona
                console.log('[VENUZ] No se encontraron datos, usando fallback');
                setContent(FALLBACK_CONTENT);
                setTotalCount(FALLBACK_CONTENT.length);
                setHasMore(false);
            }
        } catch (err: any) {
            console.error('[VENUZ] Error fetching content:', err);
            const msg = err?.message || JSON.stringify(err);
            setError(`Error al cargar contenido: ${msg}. URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING'}`);
            if (!append) {
                setContent(FALLBACK_CONTENT);
                setHasMore(false);
            }
        } finally {
            setIsLoading(false);
        }
    }, [category, limit, userId]);

    // Initial fetch
    useEffect(() => {
        setOffset(0);
        fetchContent(0, false);
    }, [category, fetchContent, userId]); // Re-fetch si cambia el usuario para personalizar

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
