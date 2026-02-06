// lib/feedDynamic.ts
// Query optimizado para contenido dinámico con priorización por tier + frescura
import { createClient } from '@supabase/supabase-js';

// Lazy init para evitar errores de build
function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
}

export interface DynamicContentItem {
    id: string;
    title: string;
    description?: string;
    category?: string;

    // URLs de media
    image_url?: string;
    thumbnail_url?: string;
    preview_video_url?: string;
    preview_type?: 'video' | 'gif' | 'iframe' | 'image' | 'embed';
    iframe_preview_url?: string;
    embed_code?: string;
    gallery_urls?: string[];

    // Afiliados
    official_website?: string;
    affiliate_url?: string;
    has_affiliate?: boolean;

    // Calidad
    content_tier?: 'premium' | 'verified' | 'scraped';
    quality_score?: number;
    is_featured?: boolean;

    // Metadata
    created_at?: string;
    preview_views?: number;
}

interface GetFeedOptions {
    category?: string;
    limit?: number;
    offset?: number;
    tier?: 'premium' | 'verified' | 'scraped' | 'all';
    city?: string;
}

export async function getDynamicFeed(options: GetFeedOptions = {}): Promise<DynamicContentItem[]> {
    const { category, limit = 20, offset = 0, tier = 'all', city } = options;
    const supabase = getSupabase();

    // Query con priorización: featured primero, luego por quality_score
    let query = supabase
        .from('content')
        .select(`
      id, title, description, category,
      image_url, thumbnail_url,
      preview_video_url, preview_type,
      iframe_preview_url, embed_code, gallery_urls,
      official_website, affiliate_url, has_affiliate,
      content_tier, quality_score, is_featured,
      created_at, preview_views, location
    `)
        .eq('active', true)
        .order('is_featured', { ascending: false })
        .order('quality_score', { ascending: false })
        .range(offset, offset + limit - 1);

    // Filtrar por categoría si se especifica
    if (category) {
        query = query.eq('category', category);
    }

    // Filtrar por tier si no es 'all'
    if (tier !== 'all') {
        query = query.eq('content_tier', tier);
    }

    // Filtrar por ciudad si se especifica
    if (city && city !== 'all' && city !== 'Todas') {
        query = query.ilike('location', `%${city}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Dynamic feed error:', error);
        return [];
    }

    // Ordenar en JS con factor de frescura (Grok formula)
    const sorted = (data || []).sort((a, b) => {
        const tierScore: Record<string, number> = { premium: 3, verified: 2, scraped: 1 };
        const aTier = tierScore[a.content_tier || 'scraped'] || 1;
        const bTier = tierScore[b.content_tier || 'scraped'] || 1;

        const now = Date.now();
        const aAge = a.created_at ? (now - new Date(a.created_at).getTime()) / 86400000 : 30; // días
        const bAge = b.created_at ? (now - new Date(b.created_at).getTime()) / 86400000 : 30;

        // Factor de frescura: items recientes tienen pequeño boost
        // Contenido premium siempre primero, luego frescura + quality
        const aFresh = Math.max(0, 1 - (aAge / 60)); // Decae en 60 días
        const bFresh = Math.max(0, 1 - (bAge / 60));

        const aScore = (aTier * 100) + (a.quality_score || 50) + (aFresh * 20) + (a.is_featured ? 200 : 0);
        const bScore = (bTier * 100) + (b.quality_score || 50) + (bFresh * 20) + (b.is_featured ? 200 : 0);

        return bScore - aScore;
    });

    return sorted as DynamicContentItem[];
}

// Helper para obtener solo contenido premium
export async function getPremiumContent(limit = 10): Promise<DynamicContentItem[]> {
    return getDynamicFeed({ tier: 'premium', limit });
}

// Helper para obtener contenido por categoría
export async function getCategoryContent(category: string, limit = 20): Promise<DynamicContentItem[]> {
    return getDynamicFeed({ category, limit });
}

// Helper para obtener contenido con videos
export async function getVideoContent(limit = 10): Promise<DynamicContentItem[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('active', true)
        .eq('preview_type', 'video')
        .not('preview_video_url', 'is', null)
        .order('quality_score', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Video content error:', error);
        return [];
    }

    return (data || []) as DynamicContentItem[];
}
