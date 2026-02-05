import { createClient } from '@supabase/supabase-js';

// ============================================
// TIPOS - Adaptados para tabla 'content' de VENUZ
// ============================================
export interface ContentItem {
    id: string;
    title: string;
    description?: string;
    image_url?: string;
    video_url?: string;
    category?: string;
    subcategory?: string;
    tags?: string[];
    location?: string;
    latitude?: number;
    longitude?: number;
    source_url?: string;
    affiliate_url?: string;
    affiliate_source?: string;
    is_verified?: boolean;
    is_premium?: boolean;
    rating?: number;
    likes: number;
    views: number;
    active?: boolean;
    is_permanent?: boolean;
    quality_score?: number;
    thumbnail_url?: string;
    medium_url?: string;
    large_url?: string;
    created_at: string;
    updated_at?: string;
    // Campos calculados
    baseScore?: number;
    finalScore?: number;
}

interface UserPreferences {
    favoriteTypes: string[];
    favoriteCategories: string[];
    location?: { lat: number; lng: number };
}

// ============================================
// SUPABASE CLIENT
// ============================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// FETCH DE CONTENIDO (tabla unificada 'content')
// ============================================
async function fetchAllContent(options?: {
    category?: string;
    limit?: number;
}): Promise<ContentItem[]> {
    const { category, limit = 500 } = options || {};

    let query = supabase
        .from('content')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (category) {
        query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching content:', error);
        return [];
    }

    return (data || []).map(item => ({
        ...item,
        likes: item.likes || 0,
        views: item.views || 0,
    }));
}

// ============================================
// SCORING ALGORITHM
// ============================================
// Palabras clave de alto valor (Ofertas reales)
const DEAL_KEYWORDS = [
    '2x1', '3x2', '50%', 'descuento', 'gratis', 'free', 'no cover',
    'barra libre', 'ladies night', 'happy hour', 'happy-hour',
    'cubetazo', 'promocion', 'promo', 'oferta', 'cumpleañero',
    'botella gratis', 'shot gratis', 'entrada libre'
];

function calculateBaseScore(item: ContentItem): number {
    const now = Date.now();
    const createdAt = new Date(item.created_at).getTime();
    const ageInHours = (now - createdAt) / (1000 * 60 * 60);

    let score = 0;

    // 1. DEAL DETECTION (El factor más importante ahora)
    const textToScan = ((item.title || '') + ' ' + (item.description || '') + ' ' + (item.tags?.join(' ') || '')).toLowerCase();
    const hasDeal = DEAL_KEYWORDS.some(keyword => textToScan.includes(keyword));

    if (hasDeal) {
        score += 500; // 💎 BOOST MASIVO A LAS OFERTAS
    }

    // 2. FILLER FUNNEL (Castigo al relleno)
    // Si no es oferta y es una categoría genérica, al fondo.
    const genericCategories = ['restaurant', 'hotel', 'cafe', 'bar_generico'];
    if (!hasDeal && item.category && genericCategories.includes(item.category)) {
        score -= 200; // 📉 PENALIZACIÓN FUERTE
    }

    // 3. Engagement (likes pesan más que views)
    score += (item.likes * 2) + (item.views * 0.1);

    // 4. Rating bonus (si existe)
    score += (item.rating || 3) * 50;

    // 5. Freshness decay - contenido nuevo tiene boost
    let freshnessScore = 0;
    if (ageInHours < 6) freshnessScore = 500;
    else if (ageInHours < 24) freshnessScore = 300;
    else if (ageInHours < 72) freshnessScore = 150;
    else if (ageInHours < 168) freshnessScore = 50;

    score += freshnessScore;

    // 6. Premium content boost
    if (item.is_premium) score += 200;

    // 7. Verified boost
    if (item.is_verified) score += 100;

    // 8. Visual Appeal
    if (item.image_url) score += 100;
    if (item.video_url) score += 150;

    return Math.max(0, score); // No permitir scores negativos
}

// ============================================
// PERSONALIZACIÓN POR USUARIO
// ============================================
async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const { data } = await supabase
        .from('user_preferences')
        .select('favorite_types, favorite_categories, lat, lng')
        .eq('user_id', userId)
        .single();

    if (!data) return null;

    return {
        favoriteTypes: data.favorite_types || [],
        favoriteCategories: data.favorite_categories || [],
        location: data.lat && data.lng ? { lat: data.lat, lng: data.lng } : undefined,
    };
}

function applyPersonalization(
    items: ContentItem[],
    prefs: UserPreferences
): ContentItem[] {
    const BOOST_FAVORITE_TYPE = 200;
    const BOOST_FAVORITE_CATEGORY = 150;
    const BOOST_NEARBY = 300;

    return items.map(item => {
        let personalBoost = 0;

        // Boost por categoría favorita
        if (item.category && prefs.favoriteCategories.includes(item.category)) {
            personalBoost += BOOST_FAVORITE_CATEGORY;
        }

        // Boost por affiliate_source favorito (camsoda, stripchat, etc.)
        if (item.affiliate_source && prefs.favoriteTypes.includes(item.affiliate_source)) {
            personalBoost += BOOST_FAVORITE_TYPE;
        }

        // Boost por cercanía
        if (prefs.location && item.latitude && item.longitude) {
            const distance = calculateDistance(
                prefs.location.lat,
                prefs.location.lng,
                item.latitude,
                item.longitude
            );
            if (distance < 5) personalBoost += BOOST_NEARBY;
            else if (distance < 15) personalBoost += BOOST_NEARBY * 0.5;
        }

        return {
            ...item,
            finalScore: (item.baseScore || 0) + personalBoost,
        };
    });
}

// Haversine formula para distancia en km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ============================================
// SMART SHUFFLE - Evita repetición de categorías
// ============================================
function smartShuffle(items: ContentItem[]): ContentItem[] {
    const sorted = [...items].sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));

    const result: ContentItem[] = [];
    const deferred: ContentItem[] = [];
    let lastCategory: string | undefined;
    let lastSource: string | undefined;

    for (const item of sorted) {
        const sameCategory = item.category && item.category === lastCategory;
        const sameSource = item.affiliate_source && item.affiliate_source === lastSource;

        if (!sameCategory && !sameSource) {
            result.push(item);
            lastCategory = item.category;
            lastSource = item.affiliate_source;
        } else {
            deferred.push(item);
        }
    }

    // Insertar los diferidos intercalados
    for (const item of deferred) {
        let inserted = false;
        for (let i = 1; i < result.length; i++) {
            const prev = result[i - 1];
            const next = result[i];
            if (prev.category !== item.category && next.category !== item.category) {
                result.splice(i, 0, item);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            result.push(item);
        }
    }

    return result;
}

// ============================================
// API PRINCIPAL
// ============================================
export async function getRecommendedFeed(options: {
    userId?: string;
    limit?: number;
    offset?: number;
    filterCategory?: string;
    excludeIds?: string[];
}): Promise<ContentItem[]> {
    const { userId, limit = 20, offset = 0, filterCategory, excludeIds = [] } = options;

    // 1. Fetch contenido
    let content = await fetchAllContent({ category: filterCategory, limit: 500 });

    // 2. Excluir IDs ya vistos
    if (excludeIds.length > 0) {
        content = content.filter(item => !excludeIds.includes(item.id));
    }

    // 3. Calcular base score
    content = content.map(item => ({
        ...item,
        baseScore: calculateBaseScore(item),
        finalScore: calculateBaseScore(item),
    }));

    // 4. Personalizar si hay usuario
    if (userId) {
        const prefs = await getUserPreferences(userId);
        if (prefs) {
            content = applyPersonalization(content, prefs);
        }
    }

    // 5. Ordenar por score
    content.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));

    // 6. Smart shuffle para variedad
    const shuffled = smartShuffle(content);

    // 7. Paginar
    return shuffled.slice(offset, offset + limit);
}

// ============================================
// FEEDS PRE-DEFINIDOS
// ============================================
export async function getTrendingFeed(limit = 20): Promise<ContentItem[]> {
    return getRecommendedFeed({ limit });
}

export async function getNearbyFeed(lat: number, lng: number, limit = 20): Promise<ContentItem[]> {
    const content = await fetchAllContent();

    const withDistance = content
        .filter(item => item.latitude && item.longitude)
        .map(item => ({
            ...item,
            distance: calculateDistance(lat, lng, item.latitude!, item.longitude!),
            baseScore: calculateBaseScore(item),
        }))
        .filter(item => (item as any).distance < 50)
        .sort((a, b) => (a as any).distance - (b as any).distance);

    return withDistance.slice(0, limit);
}

export async function getWebcamsFeed(limit = 20): Promise<ContentItem[]> {
    return getRecommendedFeed({ filterCategory: 'webcam', limit });
}

export async function getClubsFeed(limit = 20): Promise<ContentItem[]> {
    return getRecommendedFeed({ filterCategory: 'club', limit });
}

export async function getSolteroFeed(limit = 20): Promise<ContentItem[]> {
    return getRecommendedFeed({ filterCategory: 'soltero', limit });
}
