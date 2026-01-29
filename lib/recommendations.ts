// lib/recommendations.ts
// Algoritmo de recomendaciones estilo TikTok
// Código de Grok

import { supabase } from '@/lib/supabase';

export type ContentItem = {
    id: string;
    title: string;
    description?: string;
    image_url?: string;
    category: string;
    likes: number;
    views: number;
    created_at: string;
    tags?: string[];
    is_verified?: boolean;
    is_premium?: boolean;
    affiliate_source?: string;
};

interface ScoredContent extends ContentItem {
    score: number;
}

/**
 * Obtiene contenido recomendado personalizado para el usuario
 * Basado en: categorías preferidas, engagement, recencia y exploración
 */
export async function getRecommendedContent(userId?: string, limit = 20, offset = 0): Promise<ContentItem[]> {
    // 1. Fetch contenido base (usando range para paginación real)
    const { data: allContent, error } = await supabase
        .from('content')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit * 5 - 1); // Tomamos un pool de 5x el límite para poder puntuar y filtrar

    if (error || !allContent) {
        console.error('[Recommendations] Error fetching content:', error);
        return [];
    }

    // 2. Obtener categorías preferidas del usuario (de sus likes)
    let preferredCategories: string[] = [];
    let preferredTags: string[] = [];

    if (userId) {
        const { data: userLikes } = await supabase
            .from('interactions')
            .select('content_id')
            .eq('user_id', userId)
            .eq('type', 'like')
            .limit(50);

        if (userLikes?.length) {
            const likedContentIds = userLikes.map((i) => i.content_id);

            const { data: likedContent } = await supabase
                .from('content')
                .select('category, tags')
                .in('id', likedContentIds);

            // Contar categorías
            const categoryCount: Record<string, number> = {};
            const tagCount: Record<string, number> = {};

            likedContent?.forEach((c) => {
                // Categorías
                categoryCount[c.category] = (categoryCount[c.category] || 0) + 1;

                // Tags
                if (c.tags && Array.isArray(c.tags)) {
                    c.tags.forEach((tag: string) => {
                        tagCount[tag] = (tagCount[tag] || 0) + 1;
                    });
                }
            });

            // Top 5 categorías preferidas
            preferredCategories = Object.keys(categoryCount)
                .sort((a, b) => categoryCount[b] - categoryCount[a])
                .slice(0, 5);

            // Top 10 tags preferidos
            preferredTags = Object.keys(tagCount)
                .sort((a, b) => tagCount[b] - tagCount[a])
                .slice(0, 10);
        }
    }

    // 3. Calcular score para cada contenido
    const now = Date.now();
    const scoredContent: ScoredContent[] = allContent.map((item: ContentItem) => {
        let score = 0;

        // === ENGAGEMENT (40% del score) ===
        score += (item.likes || 0) * 2;
        score += (item.views || 0) * 0.5;

        // === PREFERENCIA DE CATEGORÍA (25% del score) ===
        if (preferredCategories.includes(item.category)) {
            const categoryRank = preferredCategories.indexOf(item.category);
            score += 30 - (categoryRank * 5); // Mayor peso a categorías más preferidas
        }

        // === PREFERENCIA DE TAGS (15% del score) ===
        if (item.tags && Array.isArray(item.tags)) {
            const matchingTags = item.tags.filter(tag => preferredTags.includes(tag));
            score += matchingTags.length * 10;
        }

        // === RECENCIA (15% del score) ===
        const daysOld = (now - new Date(item.created_at).getTime()) / (1000 * 3600 * 24);
        if (daysOld < 1) {
            score += 25; // Contenido de hoy
        } else if (daysOld < 7) {
            score += 20 * (1 - daysOld / 7); // Degradación gradual
        }

        // === BONUSES ===
        if (item.is_verified) score += 10;
        if (item.is_premium) score += 5;
        if (item.affiliate_source) score += 15; // Contenido monetizable

        // === EXPLORACIÓN ALEATORIA (5% del score) ===
        score += Math.random() * 15;

        return { ...item, score };
    });

    // 4. Ordenar por score y retornar top N
    return scoredContent
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ score, ...item }) => item); // Quitar score del resultado
}

/**
 * Obtiene contenido trending (basado solo en engagement reciente)
 */
export async function getTrendingContent(limit = 20): Promise<ContentItem[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
        .from('content')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('likes', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[Recommendations] Error fetching trending:', error);
        return [];
    }

    return data || [];
}

/**
 * Obtiene contenido similar a un item específico
 */
export async function getSimilarContent(contentId: string, limit = 10): Promise<ContentItem[]> {
    // Primero obtener el item original
    const { data: original } = await supabase
        .from('content')
        .select('category, tags')
        .eq('id', contentId)
        .single();

    if (!original) return [];

    // Buscar contenido de la misma categoría
    const { data: similar, error } = await supabase
        .from('content')
        .select('*')
        .eq('category', original.category)
        .neq('id', contentId)
        .order('likes', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[Recommendations] Error fetching similar:', error);
        return [];
    }

    return similar || [];
}
