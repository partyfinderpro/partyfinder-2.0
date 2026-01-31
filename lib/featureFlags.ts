// ============================================
// VENUZ HIGHWAY - Feature Flags para Rollout Gradual
// Basado en recomendaciones de Grok
// ============================================

export type FeatureFlag =
    | 'highway_algorithm'
    | 'highway_ab_testing'
    | 'highway_tracking'
    | 'highway_adult_content';

export interface RolloutConfig {
    flag: FeatureFlag;
    enabled: boolean;
    percentage: number;     // 0-100
    allowedUserIds?: string[];  // Override: siempre habilitado para estos
    blockedUserIds?: string[];  // Override: siempre deshabilitado para estos
    startDate?: Date;
    endDate?: Date;
}

// ============================================
// CONFIGURACIÓN DE ROLLOUT
// ============================================

const ROLLOUT_CONFIG: Record<FeatureFlag, RolloutConfig> = {
    highway_algorithm: {
        flag: 'highway_algorithm',
        enabled: true,
        percentage: 100,  // Empezar con 10%, subir gradualmente
        allowedUserIds: [
            'anon_1706667600_pablo',  // Pablo - testing
        ],
    },
    highway_ab_testing: {
        flag: 'highway_ab_testing',
        enabled: true,
        percentage: 100,
    },
    highway_tracking: {
        flag: 'highway_tracking',
        enabled: true,
        percentage: 100,
    },
    highway_adult_content: {
        flag: 'highway_adult_content',
        enabled: true,
        percentage: 100,
    },
};

// ============================================
// STORAGE
// ============================================

const STORAGE_KEY_FLAGS = 'venuz_feature_flags';

interface StoredFlags {
    [key: string]: boolean | number;
}

function getStoredFlags(): StoredFlags | null {
    if (typeof window === 'undefined') return null;

    try {
        const stored = localStorage.getItem(STORAGE_KEY_FLAGS);
        if (!stored) return null;

        const flags = JSON.parse(stored) as StoredFlags;

        // Expirar después de 1 hora
        const timestamp = flags.timestamp as number;
        if (timestamp && Date.now() - timestamp > 60 * 60 * 1000) {
            localStorage.removeItem(STORAGE_KEY_FLAGS);
            return null;
        }

        return flags;
    } catch {
        return null;
    }
}

function storeFlags(flags: StoredFlags): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STORAGE_KEY_FLAGS, JSON.stringify({
            ...flags,
            timestamp: Date.now(),
        }));
    } catch {
        // Ignore storage errors
    }
}

// ============================================
// FEATURE FLAG EVALUATION
// ============================================

/**
 * Evaluar si un feature flag está habilitado para un usuario
 */
export function isFeatureEnabled(flag: FeatureFlag, userId?: string): boolean {
    const config = ROLLOUT_CONFIG[flag];

    if (!config) return false;
    if (!config.enabled) return false;

    // Verificar fechas de rollout
    const now = new Date();
    if (config.startDate && now < config.startDate) return false;
    if (config.endDate && now > config.endDate) return false;

    // Si no hay userId, usar percentage check aleatorio pero persistente
    if (!userId) {
        const stored = getStoredFlags();
        if (stored && flag in stored) {
            return stored[flag] as boolean;
        }

        // Asignación aleatoria
        const enabled = Math.random() * 100 < config.percentage;
        storeFlags({ ...(stored || {}), [flag]: enabled });
        return enabled;
    }

    // Override: usuarios bloqueados
    if (config.blockedUserIds?.includes(userId)) {
        return false;
    }

    // Override: usuarios permitidos
    if (config.allowedUserIds?.includes(userId)) {
        return true;
    }

    // Evaluación basada en hash del userId (determinística)
    const hash = hashString(userId);
    const bucket = hash % 100;

    return bucket < config.percentage;
}

/**
 * Obtener todos los flags habilitados para un usuario
 */
export function getEnabledFlags(userId?: string): FeatureFlag[] {
    return (Object.keys(ROLLOUT_CONFIG) as FeatureFlag[])
        .filter(flag => isFeatureEnabled(flag, userId));
}

/**
 * Verificar si Highway Algorithm está completamente habilitado
 */
export function isHighwayEnabled(userId?: string): boolean {
    return isFeatureEnabled('highway_algorithm', userId);
}

/**
 * Verificar si A/B Testing está habilitado
 */
export function isABTestingEnabled(userId?: string): boolean {
    return isHighwayEnabled(userId) && isFeatureEnabled('highway_ab_testing', userId);
}

// ============================================
// ADMIN/DEBUG FUNCTIONS
// ============================================

/**
 * Forzar un feature flag para debugging
 */
export function forceFeatureFlag(flag: FeatureFlag, enabled: boolean): void {
    if (typeof window === 'undefined') return;

    const stored = getStoredFlags() || {};
    stored[flag] = enabled;
    stored.timestamp = Date.now();
    localStorage.setItem(STORAGE_KEY_FLAGS, JSON.stringify(stored));

    console.log(`[FeatureFlags] Forced ${flag} = ${enabled}`);
}

/**
 * Reset todos los feature flags
 */
export function resetFeatureFlags(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(STORAGE_KEY_FLAGS);
    console.log('[FeatureFlags] All flags reset');
}

/**
 * Obtener configuración actual de rollout
 */
export function getRolloutConfig(): typeof ROLLOUT_CONFIG {
    return { ...ROLLOUT_CONFIG };
}

/**
 * Log estado de todos los flags para un usuario
 */
export function debugFeatureFlags(userId?: string): void {
    console.log('\n🚩 Feature Flags Status:');
    console.log('========================');

    for (const flag of Object.keys(ROLLOUT_CONFIG) as FeatureFlag[]) {
        const enabled = isFeatureEnabled(flag, userId);
        const config = ROLLOUT_CONFIG[flag];
        console.log(
            `${enabled ? '✅' : '❌'} ${flag}: ${enabled} (${config.percentage}% rollout)`
        );
    }

    console.log('========================\n');
}

// ============================================
// UTILITIES
// ============================================

function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

// Export config for external use
export { ROLLOUT_CONFIG };
