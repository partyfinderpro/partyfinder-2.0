// ============================================
// VENUZ HIGHWAY - Referrer & Session Utilities
// Basado en sugerencias de Grok para detección robusta
// ============================================

// ============================================
// TYPES
// ============================================

export interface SessionData {
    userId: string;

    // Atribución dual (first + last)
    firstReferrer: string;
    firstReferrerTs: number;
    lastReferrer: string;
    lastReferrerTs: number;

    // UTM completo
    utm: {
        source?: string;
        medium?: string;
        campaign?: string;
        content?: string;
        term?: string;
    };

    // Intent score con decay
    intentScore: number;
    lastActiveTs: number;
    isNewSession: boolean;

    // Metadata
    country?: string;
    navigationEntry?: 'navigate' | 'reload' | 'back_forward' | 'prerender';
}

// ============================================
// CONSTANTS
// ============================================

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;  // 30 minutos
const STORAGE_KEY = 'venuz_session';

// Normalización de sources
const SOURCE_ALIASES: Record<string, string> = {
    'g.co': 'google',
    'google.com': 'google',
    'googlesyndication': 'google',
    'googleads': 'google',
    'fb': 'facebook',
    'fb.com': 'facebook',
    'facebook.com': 'facebook',
    'fbclid': 'facebook',
    'ig': 'instagram',
    'instagram.com': 'instagram',
    't.co': 'twitter',
    'twitter.com': 'twitter',
    'x.com': 'twitter',
    'linkedin.com': 'linkedin',
    'lnkd.in': 'linkedin',
    'tiktok.com': 'tiktok',
    'yt': 'youtube',
    'youtube.com': 'youtube',
    'youtu.be': 'youtube',
};

// Normalización de mediums
const MEDIUM_ALIASES: Record<string, string> = {
    'cpc': 'paid_search',
    'ppc': 'paid_search',
    'paid': 'paid_search',
    'paidsearch': 'paid_search',
    'cpm': 'display',
    'banner': 'display',
    'social': 'organic_social',
    'referral': 'referral',
    're': 'retargeting',
    'retarget': 'retargeting',
    'remarketing': 'retargeting',
    'email': 'email',
    'newsletter': 'email',
};

// Decay multipliers por canal (menor = decae más lento)
const DECAY_MULTIPLIERS: Record<string, number> = {
    'paid_search': 1.0,
    'retargeting': 0.7,    // Usuarios recargados decaen más lento
    'email': 0.6,          // Email users son más "calientes"
    'organic': 1.2,        // Orgánico decae más rápido
    'direct': 1.0,
    'organic_social': 1.1,
    'referral': 0.9,
};

// Tiered decay rates por tiempo de inactividad
const DECAY_TIERS = [
    { maxInactiveMinutes: 5, rate: 0.995 },   // Casi sin decay
    { maxInactiveMinutes: 15, rate: 0.97 },   // Decay medio
    { maxInactiveMinutes: 30, rate: 0.90 },   // Decay fuerte
    { maxInactiveMinutes: Infinity, rate: 0.50 }, // Decay muy fuerte
];

const MINIMUM_SCORE_THRESHOLD = 0.15;  // Debajo de esto = cold session

// ============================================
// REFERRER DETECTION
// ============================================

export function detectReferrerAdvanced(): {
    source: string;
    medium: string;
    campaign?: string;
    raw: string;
} {
    if (typeof window === 'undefined') {
        return { source: 'server', medium: 'none', raw: '' };
    }

    const url = new URL(window.location.href);
    const params = url.searchParams;

    // 1. Primero intentar UTM parameters
    let source = params.get('utm_source') || '';
    let medium = params.get('utm_medium') || '';
    const campaign = params.get('utm_campaign') || undefined;

    // 2. Fallback a document.referrer
    const referrer = document.referrer;

    if (!source && referrer) {
        try {
            const refUrl = new URL(referrer);
            source = refUrl.hostname.replace('www.', '');
            medium = 'referral';
        } catch {
            // Invalid referrer URL
        }
    }

    // 3. Fallback a Performance API (navegadores modernos)
    if (!source && 'performance' in window) {
        try {
            const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
            if (navEntries.length > 0) {
                const navType = navEntries[0].type;
                if (navType === 'reload') {
                    source = 'direct';
                    medium = 'reload';
                } else if (navType === 'back_forward') {
                    source = 'direct';
                    medium = 'back_forward';
                }
            }
        } catch {
            // Performance API not available
        }
    }

    // 4. Detección de parámetros especiales (fbclid, gclid, etc.)
    if (!source) {
        if (params.has('fbclid')) {
            source = 'facebook';
            medium = 'paid_social';
        } else if (params.has('gclid')) {
            source = 'google';
            medium = 'paid_search';
        } else if (params.has('msclkid')) {
            source = 'bing';
            medium = 'paid_search';
        } else if (params.has('ttclid')) {
            source = 'tiktok';
            medium = 'paid_social';
        }
    }

    // 5. Normalizar source
    source = normalizeSource(source || 'direct');
    medium = normalizeMedium(medium || 'none');

    return {
        source,
        medium,
        campaign,
        raw: referrer || url.href
    };
}

function normalizeSource(source: string): string {
    const lower = source.toLowerCase().trim();

    // Buscar alias exacto
    if (SOURCE_ALIASES[lower]) {
        return SOURCE_ALIASES[lower];
    }

    // Buscar coincidencia parcial
    for (const [alias, normalized] of Object.entries(SOURCE_ALIASES)) {
        if (lower.includes(alias)) {
            return normalized;
        }
    }

    return lower || 'direct';
}

function normalizeMedium(medium: string): string {
    const lower = medium.toLowerCase().trim();
    return MEDIUM_ALIASES[lower] || lower || 'none';
}

// ============================================
// SESSION MANAGEMENT
// ============================================

export function getSession(): SessionData | null {
    if (typeof window === 'undefined') return null;

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        return JSON.parse(stored) as SessionData;
    } catch {
        return null;
    }
}

export function saveSession(session: SessionData): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
        console.error('[Session] Error saving session');
    }
}

export function initializeOrUpdateSession(userId: string): SessionData {
    const existing = getSession();
    const now = Date.now();
    const detected = detectReferrerAdvanced();

    // Determinar si es sesión nueva
    const isNewSession = !existing ||
        (now - existing.lastActiveTs > SESSION_TIMEOUT_MS);

    if (!existing) {
        // Primera visita absoluta
        const newSession: SessionData = {
            userId,
            firstReferrer: detected.source,
            firstReferrerTs: now,
            lastReferrer: detected.source,
            lastReferrerTs: now,
            utm: {
                source: detected.source,
                medium: detected.medium,
                campaign: detected.campaign,
            },
            intentScore: 0.5,
            lastActiveTs: now,
            isNewSession: true,
        };

        saveSession(newSession);
        return newSession;
    }

    // Actualizar sesión existente
    const updatedSession: SessionData = {
        ...existing,
        userId,
        // First referrer nunca cambia
        firstReferrer: existing.firstReferrer,
        firstReferrerTs: existing.firstReferrerTs,
        // Last referrer actualiza si hay UTM o referrer válido
        lastReferrer: detected.source !== 'direct' ? detected.source : existing.lastReferrer,
        lastReferrerTs: detected.source !== 'direct' ? now : existing.lastReferrerTs,
        // UTM actualiza
        utm: {
            source: detected.source !== 'direct' ? detected.source : existing.utm.source,
            medium: detected.medium !== 'none' ? detected.medium : existing.utm.medium,
            campaign: detected.campaign || existing.utm.campaign,
        },
        lastActiveTs: now,
        isNewSession,
    };

    // Aplicar decay si había inactividad
    if (isNewSession) {
        const inactiveMinutes = (now - existing.lastActiveTs) / 60000;
        updatedSession.intentScore = applyTieredDecay(
            existing.intentScore,
            inactiveMinutes,
            existing.utm.medium
        );
    }

    saveSession(updatedSession);
    return updatedSession;
}

// ============================================
// TIERED DECAY SYSTEM
// ============================================

export function applyTieredDecay(
    currentScore: number,
    inactiveMinutes: number,
    medium?: string
): number {
    // Encontrar el tier correcto
    let decayRate = 1.0;
    for (const tier of DECAY_TIERS) {
        if (inactiveMinutes <= tier.maxInactiveMinutes) {
            decayRate = tier.rate;
            break;
        }
    }

    // Aplicar multiplier por canal
    const channelMultiplier = DECAY_MULTIPLIERS[medium || 'direct'] || 1.0;
    const effectiveRate = Math.pow(decayRate, channelMultiplier);

    // Calcular nuevo score
    let newScore = currentScore * effectiveRate;

    // Umbral mínimo - si cae muy bajo, resetear a 0 (cold)
    if (newScore < MINIMUM_SCORE_THRESHOLD) {
        console.log(`[Decay] Score ${newScore.toFixed(3)} below threshold, resetting to cold`);
        newScore = 0;
    }

    return newScore;
}

export function applyPartialReset(
    previousScore: number,
    maxBoost: number = 0.3
): number {
    // Cuando el usuario vuelve, no restaurar 100% sino 70%
    const restoredScore = previousScore + (maxBoost * 0.7);
    return Math.min(1, restoredScore);
}

// ============================================
// VISIBILITY CHANGE HANDLER
// ============================================

let visibilityHandlerInitialized = false;
let pausedAt: number | null = null;

export function initVisibilityHandler(
    onHide: () => void,
    onShow: (inactiveMs: number) => void
): () => void {
    if (typeof window === 'undefined' || visibilityHandlerInitialized) {
        return () => { };
    }

    const handler = () => {
        if (document.hidden) {
            pausedAt = Date.now();
            onHide();
        } else if (pausedAt) {
            const inactiveMs = Date.now() - pausedAt;
            pausedAt = null;
            onShow(inactiveMs);
        }
    };

    document.addEventListener('visibilitychange', handler);
    visibilityHandlerInitialized = true;

    // Return cleanup function
    return () => {
        document.removeEventListener('visibilitychange', handler);
        visibilityHandlerInitialized = false;
    };
}

// Export everything for highway algorithm
export {
    SOURCE_ALIASES,
    MEDIUM_ALIASES,
    DECAY_MULTIPLIERS,
    DECAY_TIERS,
    MINIMUM_SCORE_THRESHOLD,
    SESSION_TIMEOUT_MS
};
