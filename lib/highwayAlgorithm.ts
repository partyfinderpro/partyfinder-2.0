// ============================================
// VENUZ HIGHWAY ALGORITHM - "Level God Algorithm"
// Basado en: Briefing de Grok + Visión de Pablo
// ============================================
// 
// Este algoritmo implementa la "Supercarretera" de VENUZ:
// - Pilar 1: Adult/Monetization (webcams, sitios, smartlinks)
// - Pilar 2: PartyFinder (eventos, bares, antros, ofertas)
// - Pilar 3: Agencia/Jobs (empleos, edecanes, modelos)
//
// La transición se basa en el user_intent_score (0 a 1):
// - 0 = Usuario cold (entró por empleo)
// - 1 = Usuario hot (listo para contenido adult)
// ============================================

import { supabase } from '@/lib/supabase';
import { getDynamicDeltas, calculateEventLikeDelta, trackABEvent, type ABVariant } from '@/lib/abTestConfig';
import { getUserExperimentVariant } from '@/lib/highway/experiment';
import { getVegasStripItems } from '@/lib/vegas-strip/feed-integration'; // VEGAS INTEGRATION

// ============================================
// TYPES
// ============================================

export type ContentPillar = 'adult' | 'event' | 'job';

export interface HighwayContentItem {
    id: string;
    title: string;
    description?: string;
    image_url?: string;
    video_url?: string;
    category: string;
    subcategory?: string;
    pillar: ContentPillar;
    location?: string;
    city?: string;
    state?: string;
    geo_slug?: string;
    latitude?: number;
    longitude?: number;
    affiliate_url?: string;
    affiliate_source?: string;
    smartlink_url?: string;
    is_verified?: boolean;
    is_premium?: boolean;
    likes: number;
    views: number;
    created_at: string;
    extra_data?: Record<string, any>;
    // Scoring
    baseScore?: number;
    finalScore?: number;
    pillarWeight?: number;
}

export interface UserIntent {
    userId: string;
    intentScore: number;          // 0 (cold/job) to 1 (hot/adult)
    initialReferrer: 'empleo' | 'evento' | 'adult' | 'direct' | 'organic';
    likesJob: number;
    likesEvent: number;
    likesAdult: number;
    totalViews: number;
    location?: { lat: number; lng: number };
    lastUpdated: string;
}

// ============================================
// CONSTANTS
// ============================================

// Inicialización por referrer (de dónde viene el tráfico)
const INITIAL_INTENT_BY_REFERRER: Record<string, number> = {
    'empleo': 0.0,      // Usuario de FB/LinkedIn buscando trabajo
    'evento': 0.4,      // Usuario buscando eventos/parties
    'adult': 0.8,       // Usuario directo a contenido adult
    'direct': 0.5,      // Usuario directo (sin referrer)
    'organic': 0.3,     // Usuario de Google (probablemente buscando info)
};

// Deltas para actualizar intent_score (valores por defecto - A/B testing los sobrescribe)
const INTENT_DELTAS = {
    VIEW_CONTENT: 0.01,
    LIKE_JOB: 0.05,
    LIKE_EVENT: 0.15,       // Acelerador clave (lleva hacia adult)
    LIKE_ADULT: 0.03,       // Refuerzo menor (ya está caliente)
    THIRD_LIKE_EVENT_BONUS: 0.30,  // Salto significativo al 3er like de evento
    FIFTH_LIKE_EVENT_BONUS: 0.20,  // Bonus adicional al 5to like (variante A)
};

// Mapeo de categorías a pilares
const CATEGORY_TO_PILLAR: Record<string, ContentPillar> = {
    // Pilar 1: Adult/Monetization
    'webcam': 'adult',
    'camsoda': 'adult',
    'stripchat': 'adult',
    'chaturbate': 'adult',
    'soltero': 'adult',
    'live-cams': 'adult',
    'ai-porn': 'adult',
    'free-tubes': 'adult',
    'hookup': 'adult',
    'stripclub': 'adult',
    'sexshop': 'adult',
    'masaje': 'adult',

    // Pilar 2: PartyFinder (Events)
    'evento': 'event',
    'event': 'event',
    'bar': 'event',
    'club': 'event',
    'concierto': 'event',
    'fiesta': 'event',
    'restaurante': 'event',
    'hotel': 'event',
    'tour': 'event',
    'actividad': 'event',

    // Pilar 3: Jobs/Agencia
    'empleo': 'job',
    'job': 'job',
    'edecanes': 'job',
    'modelo': 'job',
    'gio': 'job',
    'demostradora': 'job',
    'bailarina': 'job',
    'casting': 'job',
    'agencia': 'job',
};

// ============================================
// WEIGHT CALCULATION (Fórmula cuadrática de Grok)
// ============================================

// lib/highwayAlgorithm.ts (Weights with A/B Testing)

export function calculatePillarWeights(
    intentScore: number,
    modifiers?: { party_weight?: number; adult_weight?: number }
): {
    wJob: number;
    wEvent: number;
    wAdult: number
} {
    const clampedScore = Math.max(0, Math.min(1, intentScore));

    // Base weights (Grok formula)
    let wJob = Math.pow(1 - clampedScore, 2);
    let wEvent = 2 * clampedScore * (1 - clampedScore);
    let wAdult = Math.pow(clampedScore, 2);

    // Apply A/B modifiers if present
    if (modifiers) {
        if (modifiers.party_weight) wEvent *= modifiers.party_weight;
        if (modifiers.adult_weight) wAdult *= modifiers.adult_weight;
    }

    // Normalizar para que sumen 1
    const total = wJob + wEvent + wAdult;

    return {
        wJob: wJob / total,
        wEvent: wEvent / total,
        wAdult: wAdult / total,
    };
}

// ============================================
// USER INTENT MANAGEMENT
// ============================================

export async function getUserIntent(userId: string): Promise<UserIntent | null> {
    const { data, error } = await supabase
        .from('user_intents')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !data) return null;

    return {
        userId: data.user_id,
        intentScore: data.intent_score,
        initialReferrer: data.initial_referrer,
        likesJob: data.likes_job || 0,
        likesEvent: data.likes_event || 0,
        likesAdult: data.likes_adult || 0,
        totalViews: data.total_views || 0,
        location: data.lat && data.lng ? { lat: data.lat, lng: data.lng } : undefined,
        lastUpdated: data.updated_at,
    };
}

export async function createUserIntent(
    userId: string,
    referrer: string = 'direct',
    location?: { lat: number; lng: number }
): Promise<UserIntent> {
    const referrerType = detectReferrerType(referrer);
    const initialScore = INITIAL_INTENT_BY_REFERRER[referrerType] || 0.5;

    const newIntent: Partial<UserIntent> = {
        userId,
        intentScore: initialScore,
        initialReferrer: referrerType as UserIntent['initialReferrer'],
        likesJob: 0,
        likesEvent: 0,
        likesAdult: 0,
        totalViews: 0,
        location,
        lastUpdated: new Date().toISOString(),
    };

    const { error } = await supabase
        .from('user_intents')
        .upsert({
            user_id: userId,
            intent_score: initialScore,
            initial_referrer: referrerType,
            likes_job: 0,
            likes_event: 0,
            likes_adult: 0,
            total_views: 0,
            lat: location?.lat,
            lng: location?.lng,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

    if (error) {
        console.error('[Highway] Error creating user intent:', error);
    }

    return newIntent as UserIntent;
}

function detectReferrerType(referrer: string): string {
    const r = referrer.toLowerCase();

    // Detectar origen del tráfico
    if (r.includes('empleo') || r.includes('job') || r.includes('linkedin') || r.includes('trabajo')) {
        return 'empleo';
    }
    if (r.includes('evento') || r.includes('party') || r.includes('fiesta') || r.includes('concierto')) {
        return 'evento';
    }
    if (r.includes('adult') || r.includes('xxx') || r.includes('cam') || r.includes('porn')) {
        return 'adult';
    }
    if (r.includes('google') || r.includes('bing') || r.includes('search')) {
        return 'organic';
    }

    return 'direct';
}

// ============================================
// INTENT SCORE UPDATE (The Transition Wheel)
// ============================================

export async function updateUserIntentOnInteraction(
    userId: string,
    action: 'view' | 'like',
    contentPillar: ContentPillar
): Promise<number> {
    // Obtener intent actual
    let intent = await getUserIntent(userId);

    if (!intent) {
        intent = await createUserIntent(userId);
    }

    // Obtener deltas dinámicos según variante A/B del usuario
    const dynamicDeltas = getDynamicDeltas(userId);

    let delta = 0;
    let newLikesJob = intent.likesJob;
    let newLikesEvent = intent.likesEvent;
    let newLikesAdult = intent.likesAdult;
    let newViews = intent.totalViews;

    if (action === 'view') {
        delta = dynamicDeltas.viewContent;
        newViews += 1;
    } else if (action === 'like') {
        switch (contentPillar) {
            case 'job':
                delta = dynamicDeltas.likeJob;
                newLikesJob += 1;
                break;
            case 'event':
                // Usar función A/B que incluye Third + Fifth like bonuses
                delta = calculateEventLikeDelta(userId, intent.likesEvent);
                newLikesEvent += 1;

                // Log para debugging
                if (newLikesEvent === 3) {
                    console.log('[Highway] 🎯 Third Event Like! Injecting Adult content...');
                } else if (newLikesEvent === 5 && dynamicDeltas.fifthLikeBonus > 0) {
                    console.log('[Highway] 🔥 Fifth Event Like! Extra boost applied!');
                }
                break;
            case 'adult':
                delta = dynamicDeltas.likeAdult;
                newLikesAdult += 1;
                break;
        }

        // Track A/B event para analytics
        trackABEvent(userId, 'like', { pillar: contentPillar, delta });
    }

    // Calcular nuevo score (clamped 0-1)
    const newScore = Math.max(0, Math.min(1, intent.intentScore + delta));

    // Actualizar en DB
    const { error } = await supabase
        .from('user_intents')
        .update({
            intent_score: newScore,
            likes_job: newLikesJob,
            likes_event: newLikesEvent,
            likes_adult: newLikesAdult,
            total_views: newViews,
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

    if (error) {
        console.error('[Highway] Error updating intent:', error);
    }

    return newScore;
}

// ============================================
// CONTENT PILLAR DETECTION
// ============================================

export function detectPillar(category: string, extra?: Record<string, any>): ContentPillar {
    const normalizedCategory = category.toLowerCase().trim();

    // Buscar en mapeo
    if (CATEGORY_TO_PILLAR[normalizedCategory]) {
        return CATEGORY_TO_PILLAR[normalizedCategory];
    }

    // Heurísticas adicionales
    if (extra?.smartlink_url || extra?.affiliate_partner) {
        return 'adult';
    }

    if (extra?.salary_range || extra?.requirements) {
        return 'job';
    }

    if (extra?.start_date || extra?.venue_name) {
        return 'event';
    }

    // Default: evento (más seguro legalmente)
    return 'event';
}

// ============================================
// THE HIGHWAY FEED ALGORITHM
// ============================================

export async function getHighwayFeed(options: {
    userId?: string;
    intentScore?: number;  // Override manual del score
    location?: { lat: number; lng: number };
    limit?: number;
    offset?: number;
}): Promise<HighwayContentItem[]> {
    const { userId, location, limit = 20, offset = 0 } = options;

    // 1. Obtener intent del usuario
    let intentScore = options.intentScore ?? 0.5;  // Default: medio

    if (userId) {
        const intent = await getUserIntent(userId);
        if (intent) {
            intentScore = intent.intentScore;
        }
    }

    // 2. Calcular pesos por pilar con A/B Testing
    let modifiers = undefined;
    if (userId) {
        const variant = await getUserExperimentVariant('party_vs_adult_boost', userId);
        if (variant === 'B') {
            modifiers = { party_weight: 0.8, adult_weight: 1.4 };
            console.log(`[Highway] A/B Test 'party_vs_adult_boost' ACTIVE: Variant B applied (+Adult, -Party)`);
        }
    }

    const weights = calculatePillarWeights(intentScore, modifiers);
    console.log(`[Highway] Intent: ${intentScore.toFixed(2)} → Weights: Job=${(weights.wJob * 100).toFixed(0)}%, Event=${(weights.wEvent * 100).toFixed(0)}%, Adult=${(weights.wAdult * 100).toFixed(0)}%`);

    // 3. Calcular cantidad de items por pilar
    const numJob = Math.round(limit * weights.wJob);
    const numEvent = Math.round(limit * weights.wEvent);
    const numAdult = limit - numJob - numEvent;  // El resto para adult

    // 4. Fetch contenido de cada pilar
    const [jobContent, eventContent, adultContent] = await Promise.all([
        fetchPillarContent('job', numJob, offset, location),
        fetchPillarContent('event', numEvent, offset, location),
        fetchPillarContent('adult', numAdult, offset, location),
    ]);

    // 5. Asignar scores con peso del pilar
    const scoredJob = jobContent.map(item => ({
        ...item,
        pillar: 'job' as ContentPillar,
        pillarWeight: weights.wJob,
        finalScore: calculateItemScore(item) * weights.wJob,
    }));

    const scoredEvent = eventContent.map(item => ({
        ...item,
        pillar: 'event' as ContentPillar,
        pillarWeight: weights.wEvent,
        finalScore: calculateItemScore(item) * weights.wEvent,
    }));

    const scoredAdult = adultContent.map(item => ({
        ...item,
        pillar: 'adult' as ContentPillar,
        pillarWeight: weights.wAdult,
        finalScore: calculateItemScore(item) * weights.wAdult,
    }));

    // 5.5. Fetch Vegas Strip Items (The Spice)
    const vegasItems = await getVegasStripItems(Math.ceil(limit * 0.2)); // 20% Vegas content

    // 6. Combinar y mezclar inteligentemente
    const combined = [...scoredJob, ...scoredEvent, ...scoredAdult, ...vegasItems];
    const shuffled = smartShufflePillars(combined);

    return shuffled;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function fetchPillarContent(
    pillar: ContentPillar,
    limit: number,
    offset: number,
    location?: { lat: number; lng: number }
): Promise<HighwayContentItem[]> {
    if (limit <= 0) return [];

    // Determinar categorías para este pilar
    const pillarCategories = Object.entries(CATEGORY_TO_PILLAR)
        .filter(([_, p]) => p === pillar)
        .map(([cat, _]) => cat);

    // 🚀 GEO-FIRST STRATEGY
    // Si tenemos ubicación, intentamos primero obtener contenido local
    if (location && offset === 0) { // Solo en la primera página para consistencia
        try {
            // Llamamos al RPC de cercanía (trae todo lo cercano sin filtrar categoría por SQL por ahora)
            const { data: geoData, error: geoError } = await supabase.rpc('nearby_events', {
                user_lat: location.lat,
                user_lon: location.lng,
                max_distance_km: 100, // 100km radio
                cat_ids: null
            });

            if (!geoError && geoData) {
                // Filtrar en memoria por las categorías del pilar actual
                const localPillarItems = (geoData as HighwayContentItem[]).filter(item =>
                    pillarCategories.includes(item.category?.toLowerCase() || '')
                );

                // Si encontramos suficientes items locales, los devolvemos priorizados
                if (localPillarItems.length > 0) {
                    console.log(`[Highway] Found ${localPillarItems.length} local items for ${pillar} in ${location.lat},${location.lng}`);
                    // Normalizar y devolver (slice por si el RPC trajo demasiados)
                    return localPillarItems.slice(0, limit).map(item => ({
                        ...item,
                        pillar,
                        likes: item.likes || 0,
                        views: item.views || 0,
                        // Boost extra por ser local
                        baseScore: (item.baseScore || 0) + 500
                    }));
                }
            }
        } catch (e) {
            console.warn('[Highway] Geo-fetch failed, falling back to global:', e);
        }
    }

    // FALLBACK: Query Global Estándar (Si falla geo o no hay items locales)
    let query = supabase
        .from('content')
        .select('*')
        .in('category', pillarCategories)
        // 🔥 SQL Filtering: Bloquear basura en origen (DESACTIVADO PARA REACTIVAR 20k URLs)
        // .not('source_url', 'ilike', '%theporndude%')
        // .not('title', 'ilike', '%porn sites%') 
        // .not('title', 'ilike', '%sex cams%')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
        console.error(`[Highway] Error fetching ${pillar} content:`, error);
        return [];
    }

    return (data || []).map(item => ({
        ...item,
        pillar,
        likes: item.likes || 0,
        views: item.views || 0,
    }));
}

function calculateItemScore(item: HighwayContentItem): number {
    let score = 100;  // Base

    // Engagement
    score += (item.likes || 0) * 2;
    score += (item.views || 0) * 0.1;

    // Recencia (primeras 24h = boost)
    const hoursOld = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60);
    if (hoursOld < 6) score += 200;
    else if (hoursOld < 24) score += 100;
    else if (hoursOld < 72) score += 50;

    // Premium/Verified
    if (item.is_premium) score += 100;
    if (item.is_verified) score += 50;

    // Contenido visual
    if (item.image_url) score += 30;
    if (item.video_url) score += 50;

    // Monetizable (adult con smartlink)
    if (item.smartlink_url || item.affiliate_url) score += 80;

    return score;
}

function smartShufflePillars(items: HighwayContentItem[]): HighwayContentItem[] {
    // Ordenar por score primero
    const sorted = [...items].sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));

    if (sorted.length <= 3) return sorted;

    // Intercalar para evitar 3+ items del mismo pilar consecutivos
    const result: HighwayContentItem[] = [];
    const queues: Record<ContentPillar, HighwayContentItem[]> = {
        job: sorted.filter(i => i.pillar === 'job'),
        event: sorted.filter(i => i.pillar === 'event'),
        adult: sorted.filter(i => i.pillar === 'adult'),
    };

    let lastPillar: ContentPillar | null = null;
    let consecutiveCount = 0;

    while (result.length < sorted.length) {
        let added = false;

        // Prioridad por peso
        const pillarOrder: ContentPillar[] = ['adult', 'event', 'job'];
        pillarOrder.sort((a, b) => {
            const lenA = queues[a].length;
            const lenB = queues[b].length;
            return lenB - lenA;
        });

        for (const pillar of pillarOrder) {
            if (queues[pillar].length === 0) continue;

            // Evitar más de 2 consecutivos del mismo pilar
            if (pillar === lastPillar && consecutiveCount >= 2) continue;

            const item = queues[pillar].shift()!;
            result.push(item);

            if (pillar === lastPillar) {
                consecutiveCount++;
            } else {
                lastPillar = pillar;
                consecutiveCount = 1;
            }

            added = true;
            break;
        }

        // Si no pudimos agregar nada (todos bloqueados), forzar uno
        if (!added) {
            for (const pillar of pillarOrder) {
                if (queues[pillar].length > 0) {
                    result.push(queues[pillar].shift()!);
                    break;
                }
            }
        }
    }

    return result;
}

// ============================================
// EXPORTS ADICIONALES PARA COMPATIBILIDAD
// ============================================

export { CATEGORY_TO_PILLAR, INITIAL_INTENT_BY_REFERRER, INTENT_DELTAS };
