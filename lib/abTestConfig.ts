// ============================================
// VENUZ HIGHWAY - A/B Testing Configuration
// Basado en recomendaciones de Grok para optimización
// ============================================

// ============================================
// A/B TEST VARIANTS (Grok's Recommendations)
// ============================================

export type ABVariant = 'control' | 'A' | 'B' | 'C';

export interface ABTestConfig {
    variant: ABVariant;
    name: string;
    description: string;
    likeEvent: number;
    thirdLikeBonus: number;
    // Deltas adicionales
    likeJob: number;
    likeAdult: number;
    viewContent: number;
    // Bonuses opcionales
    fifthLikeBonus?: number;
    categoryMultipliers?: Record<string, number>;
}

/**
 * Variantes de A/B Testing según recomendaciones de Grok
 * 
 * Ejemplo de impacto con 3 likes seguidos:
 * - Control: 0.15 + 0.15 + (0.15 + 0.30) = 0.75
 * - A: 0.12 + 0.12 + (0.12 + 0.45) = 0.81 (+8%)
 * - B: 0.18 + 0.18 + (0.18 + 0.20) = 0.74 (-1%, pero mejor en 4+ likes)
 * - C: 0.20 + 0.20 + (0.20 + 0.35) = 0.95 (+27%)
 */
export const AB_VARIANTS: Record<ABVariant, ABTestConfig> = {
    control: {
        variant: 'control',
        name: 'Control (Baseline)',
        description: 'Valores originales estables',
        likeEvent: 0.15,
        thirdLikeBonus: 0.30,
        likeJob: 0.05,
        likeAdult: 0.03,
        viewContent: 0.01,
    },
    A: {
        variant: 'A',
        name: 'Reward Bursts',
        description: 'Reduce premio individual, sube bonus de 3+ likes para incentivar compromiso real',
        likeEvent: 0.12,
        thirdLikeBonus: 0.45,  // 3.75x un like normal
        likeJob: 0.04,
        likeAdult: 0.02,
        viewContent: 0.01,
        fifthLikeBonus: 0.20,  // Bonus adicional al 5to like
    },
    B: {
        variant: 'B',
        name: 'Smooth Progression',
        description: 'Premio lineal, menos cliff en tercero, ideal para usuarios consistentes',
        likeEvent: 0.18,
        thirdLikeBonus: 0.20,
        likeJob: 0.06,
        likeAdult: 0.04,
        viewContent: 0.015,
    },
    C: {
        variant: 'C',
        name: 'Aggressive Early',
        description: 'Premio alto desde el inicio, captura intención temprana rápidamente',
        likeEvent: 0.20,
        thirdLikeBonus: 0.35,
        likeJob: 0.08,
        likeAdult: 0.05,
        viewContent: 0.02,
        categoryMultipliers: {
            // Multiplicadores por categoría específica
            'webcam': 1.2,
            'soltero': 1.3,
            'evento': 1.0,
            'empleo': 0.8,
        },
    },
};

// ============================================
// USER ASSIGNMENT
// ============================================

const STORAGE_KEY_VARIANT = 'venuz_ab_variant';

/**
 * Asigna una variante A/B al usuario basándose en hash del userId
 * Distribución: 25% cada variante
 */
export function assignVariant(userId: string): ABVariant {
    // Primero verificar si ya tiene variante asignada
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY_VARIANT);
        if (stored && isValidVariant(stored)) {
            return stored as ABVariant;
        }
    }

    // Asignar basándose en hash del userId para consistencia
    const hash = hashString(userId);
    const bucket = hash % 100;

    let variant: ABVariant;
    if (bucket < 25) {
        variant = 'control';
    } else if (bucket < 50) {
        variant = 'A';
    } else if (bucket < 75) {
        variant = 'B';
    } else {
        variant = 'C';
    }

    // Guardar en localStorage para persistencia
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_VARIANT, variant);
    }

    console.log(`[A/B Test] User ${userId.substring(0, 8)}... assigned to variant: ${variant}`);

    return variant;
}

/**
 * Forzar una variante específica (para testing/debugging)
 */
export function forceVariant(variant: ABVariant): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_VARIANT, variant);
        console.log(`[A/B Test] Forced variant: ${variant}`);
    }
}

/**
 * Obtener la configuración actual del usuario
 */
export function getUserABConfig(userId: string): ABTestConfig {
    const variant = assignVariant(userId);
    return AB_VARIANTS[variant];
}

// ============================================
// DYNAMIC DELTAS
// ============================================

export interface DeltaConfig {
    likeEvent: number;
    likeJob: number;
    likeAdult: number;
    viewContent: number;
    thirdLikeBonus: number;
    fifthLikeBonus: number;
}

/**
 * Obtener deltas dinámicos basados en la variante A/B del usuario
 */
export function getDynamicDeltas(userId: string): DeltaConfig {
    const config = getUserABConfig(userId);

    return {
        likeEvent: config.likeEvent,
        likeJob: config.likeJob,
        likeAdult: config.likeAdult,
        viewContent: config.viewContent,
        thirdLikeBonus: config.thirdLikeBonus,
        fifthLikeBonus: config.fifthLikeBonus || 0,
    };
}

/**
 * Calcular delta total para un like de evento (con bonuses)
 */
export function calculateEventLikeDelta(
    userId: string,
    currentEventLikes: number
): number {
    const deltas = getDynamicDeltas(userId);
    let delta = deltas.likeEvent;

    // Third Like Rule
    if (currentEventLikes === 2) {  // Este será el tercero
        delta += deltas.thirdLikeBonus;
        console.log(`[A/B Test] 🎯 Third like bonus applied: +${deltas.thirdLikeBonus}`);
    }

    // Fifth Like Bonus (si está configurado)
    if (currentEventLikes === 4 && deltas.fifthLikeBonus > 0) {
        delta += deltas.fifthLikeBonus;
        console.log(`[A/B Test] 🔥 Fifth like bonus applied: +${deltas.fifthLikeBonus}`);
    }

    return delta;
}

// ============================================
// ANALYTICS & TRACKING
// ============================================

export interface ABAnalytics {
    variant: ABVariant;
    userId: string;
    timestamp: number;
    event:
    | 'assignment'
    | 'like'
    | 'conversion'
    | 'bounce'
    // Nuevos eventos recomendados por Grok:
    | 'intent_score_update'
    | 'third_like_bonus_triggered'
    | 'fifth_like_bonus_triggered'
    | 'session_end'
    | 'page_view'
    | 'highway_api_call';
    data?: Record<string, any>;
}

const analyticsQueue: ABAnalytics[] = [];

/**
 * Trackear evento de A/B test
 */
export function trackABEvent(
    userId: string,
    event: ABAnalytics['event'],
    data?: Record<string, any>
): void {
    const variant = assignVariant(userId);

    const analyticsEvent: ABAnalytics = {
        variant,
        userId,
        timestamp: Date.now(),
        event,
        data,
    };

    analyticsQueue.push(analyticsEvent);

    // Log para debugging
    console.log(`[A/B Analytics] ${event}`, { variant, ...data });

    // Flush queue si hay muchos eventos
    if (analyticsQueue.length >= 10) {
        flushAnalytics();
    }
}

/**
 * Enviar eventos a backend
 * ✅ ACTIVADO - Ahora envía a /api/analytics/ab
 */
async function flushAnalytics(): Promise<void> {
    if (analyticsQueue.length === 0) return;

    const events = [...analyticsQueue];
    analyticsQueue.length = 0;

    try {
        // ✅ Enviando a la API de analytics
        await fetch('/api/analytics/ab', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events }),
        });
        console.log(`[A/B Analytics] Flushed ${events.length} events`);
    } catch (error) {
        console.error('[A/B Analytics] Error flushing:', error);
        // Re-queue fallidos
        analyticsQueue.push(...events);
    }
}

// ============================================
// TRACKING HELPERS (Recomendados por Grok)
// ============================================

/**
 * Track cuando el intent_score cambia
 */
export function trackIntentUpdate(
    userId: string,
    newScore: number,
    delta: number,
    trigger: 'like' | 'view' | 'decay' | 'bonus'
): void {
    trackABEvent(userId, 'intent_score_update', {
        new_score: newScore,
        delta,
        trigger,
    });
}

/**
 * Track cuando se dispara el Third Like Bonus
 */
export function trackThirdLikeBonus(
    userId: string,
    timeSinceFirstLikeMs: number
): void {
    trackABEvent(userId, 'third_like_bonus_triggered', {
        time_since_first_like: timeSinceFirstLikeMs,
        time_since_first_like_min: (timeSinceFirstLikeMs / 60000).toFixed(2),
    });
}

/**
 * Track cuando se dispara el Fifth Like Bonus (solo variante A)
 */
export function trackFifthLikeBonus(userId: string): void {
    trackABEvent(userId, 'fifth_like_bonus_triggered', {});
}

/**
 * Track fin de sesión con métricas
 */
export function trackSessionEnd(
    userId: string,
    finalScore: number,
    durationMs: number,
    totalLikes: number
): void {
    trackABEvent(userId, 'session_end', {
        final_intent_score: finalScore,
        duration_min: (durationMs / 60000).toFixed(2),
        total_likes: totalLikes,
    });
}

/**
 * Track llamada al API Highway (para monitorear performance)
 */
export function trackHighwayAPICall(
    userId: string,
    responseTimeMs: number,
    scoreReturned: number
): void {
    trackABEvent(userId, 'highway_api_call', {
        response_time_ms: responseTimeMs,
        score_returned: scoreReturned,
    });
}

// ============================================
//  METRICS HELPERS
// ============================================

/**
 * Calcular score esperado con N likes de evento
 */
export function simulateScore(variant: ABVariant, eventLikes: number): number {
    const config = AB_VARIANTS[variant];
    let score = 0;

    for (let i = 0; i < eventLikes; i++) {
        score += config.likeEvent;

        // Third like bonus
        if (i === 2) {
            score += config.thirdLikeBonus;
        }

        // Fifth like bonus
        if (i === 4 && config.fifthLikeBonus) {
            score += config.fifthLikeBonus;
        }
    }

    return score;
}

/**
 * Generar tabla comparativa de variantes
 */
export function generateComparisonTable(): void {
    console.log('\n📊 A/B Variant Comparison (Event Likes → Score):');
    console.log('════════════════════════════════════════════════');

    const variants: ABVariant[] = ['control', 'A', 'B', 'C'];
    const likeCounts = [1, 2, 3, 4, 5, 10];

    // Header
    console.log(`Likes\t${variants.join('\t')}`);
    console.log('────────────────────────────────────────');

    // Rows
    for (const likes of likeCounts) {
        const scores = variants.map(v => simulateScore(v, likes).toFixed(2));
        console.log(`${likes}\t${scores.join('\t')}`);
    }

    console.log('');
}

// ============================================
// UTILITIES
// ============================================

function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;  // Convert to 32bit integer
    }
    return Math.abs(hash);
}

function isValidVariant(value: string): value is ABVariant {
    return ['control', 'A', 'B', 'C'].includes(value);
}

// ============================================
// ALIAS EXPORT (solo para VARIANTS)
// ============================================

export { AB_VARIANTS as VARIANTS };

