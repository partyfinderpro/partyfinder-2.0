'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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
    },
    {
        id: "3",
        title: "Tributo a Queen - Teatro Vallarta",
        description: "Espectáculo musical con la banda Bohemian Symphony",
        image_url: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80",
        category: "concierto",
        location: "Centro",
        distance_km: 2.5,
        is_verified: true,
        is_open_now: false,
        views: 892,
        likes: 145,
    },
    {
        id: "4",
        title: "CamSoda Live - Valentina",
        description: "En vivo ahora - Show especial de viernes",
        image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
        category: "live",
        affiliate_url: "https://www.camsoda.com/?refId=venuz",
        affiliate_source: "camsoda",
        is_verified: true,
        is_premium: true,
        views: 5678,
        likes: 1234,
        viewers_now: 847,
    },
    {
        id: "5",
        title: "La Cantina del Pancho",
        description: "Mezcales artesanales y coctelería mexicana",
        image_url: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80",
        category: "bar",
        location: "5 de Diciembre",
        distance_km: 1.8,
        is_verified: true,
        is_open_now: true,
        open_until: "2:00 AM",
        views: 445,
        likes: 89,
    },
];

export function useContent(options: UseContentOptions = {}): UseContentReturn {
    const { category, limit = 20, offset: initialOffset = 0 } = options;

    const [content, setContent] = useState<ContentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(initialOffset);
    const [totalCount, setTotalCount] = useState(0);

    // Fetch content from Supabase
    const fetchContent = useCallback(async (currentOffset: number, append: boolean = false) => {
        setIsLoading(true);
        setError(null);

        try {
            // Build query
            let query = supabase
                .from('content')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(currentOffset, currentOffset + limit - 1);

            // Filter by category if specified
            if (category) {
                query = query.eq('category', category);
            }

            const { data, error: fetchError, count } = await query;

            if (fetchError) {
                throw fetchError;
            }

            // Check if we got data
            if (data && data.length > 0) {
                const formattedData = data.map((item: Record<string, unknown>) => ({
                    ...item,
                    // Ensure proper typing
                    affiliate_source: item.affiliate_source as ContentItem['affiliate_source'],
                })) as ContentItem[];

                if (append) {
                    setContent(prev => [...prev, ...formattedData]);
                } else {
                    setContent(formattedData);
                }

                setTotalCount(count || 0);
                setHasMore(data.length === limit);
            } else {
                // No data in Supabase, use fallback
                console.log('[VENUZ] No data in Supabase, using fallback content');

                if (!append) {
                    // Filter fallback by category if needed
                    const filteredFallback = category
                        ? FALLBACK_CONTENT.filter(item => item.category === category)
                        : FALLBACK_CONTENT;

                    setContent(filteredFallback);
                    setTotalCount(filteredFallback.length);
                }
                setHasMore(false);
            }
        } catch (err) {
            console.error('[VENUZ] Error fetching content:', err);
            setError('Error al cargar contenido');

            // Use fallback on error
            if (!append) {
                const filteredFallback = category
                    ? FALLBACK_CONTENT.filter(item => item.category === category)
                    : FALLBACK_CONTENT;

                setContent(filteredFallback);
                setTotalCount(filteredFallback.length);
            }
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [category, limit]);

    // Initial fetch
    useEffect(() => {
        setOffset(0);
        fetchContent(0, false);
    }, [category, fetchContent]);

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

                // Try to find in fallback
                const fallbackItem = FALLBACK_CONTENT.find(item => item.id === id);
                if (fallbackItem) {
                    setItem(fallbackItem);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchItem();
    }, [id]);

    return { item, isLoading, error };
}

export default useContent;
