// ============================================
// VENUZ - Integración Highway Feed con Feature Flag
// Archivo temporal de ejemplo para integración
// ============================================
// 
// INSTRUCCIONES:
// 1. Este código muestra cómo integrar useHighwayFeed en la página principal
// 2. Usa el feature flag para rollout gradual (10% → 25% → 50% → 100%)
// 3. Fallback a useContent si Highway no está activo
//
// PARA INTEGRAR:
// - Reemplazar el useContent actual por este wrapper
// - O usar directamente el ejemplo de abajo
// ============================================

import { useHighwayFeed } from '@/hooks/useHighwayFeed';
import { useContent, type ContentItem } from '@/hooks/useContent';
import { isHighwayEnabled } from '@/lib/featureFlags';

/**
 * Hook wrapper que decide entre Highway y Legacy feed
 * Basado en el feature flag para rollout gradual
 */
export function useAdaptiveFeed(options: {
    category?: string;
    mode?: string;
    search?: string;
    city?: string;
    limit?: number;
}) {
    const userId = typeof window !== 'undefined'
        ? localStorage.getItem('venuz_user_id')
        : null;

    // Verificar si Highway está habilitado para este usuario
    const highwayEnabled = isHighwayEnabled(userId || undefined);

    // Highway Feed (nuevo algoritmo)
    const highway = useHighwayFeed({
        limit: options.limit || 20,
    });

    // Legacy Feed (feed actual)
    const legacy = useContent({
        category: options.category,
        mode: options.mode as any,
        search: options.search,
        city: options.city,
    });

    // Retornar el feed según el feature flag
    if (highwayEnabled) {
        console.log('[VENUZ] 🛣️ Using Highway Algorithm feed');
        return {
            // Cast a ContentItem[] para compatibilidad
            content: highway.feed as unknown as ContentItem[],
            isLoading: highway.isLoading,
            error: highway.error,
            hasMore: highway.hasMore,
            loadMore: highway.loadMore,
            refresh: highway.refresh,
            totalCount: highway.feed.length,
            // Extra info de Highway
            isHighwayActive: true,
            intentScore: highway.intentScore,
            abVariant: highway.abVariant,
            weights: highway.weights,
        };
    }

    console.log('[VENUZ] 📋 Using Legacy feed');
    return {
        content: legacy.content,
        isLoading: legacy.isLoading,
        error: legacy.error,
        hasMore: legacy.hasMore,
        loadMore: legacy.loadMore,
        refresh: legacy.refresh,
        totalCount: legacy.totalCount,
        // Highway no activo
        isHighwayActive: false,
        intentScore: 0.5,
        abVariant: null,
        weights: { wJob: 0.33, wEvent: 0.33, wAdult: 0.33 },
    };
}

// ============================================
// EJEMPLO DE USO EN PÁGINA PRINCIPAL
// ============================================
/*

// En app/page.tsx, reemplazar:

// ANTES (líneas 88-101):
const {
    content,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    totalCount
} = useContent({
    category: selectedCategory || undefined,
    mode: activeMenu as any,
    search: searchQuery,
    city: selectedCity
});

// DESPUÉS:
const {
    content,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    totalCount,
    isHighwayActive,  // <-- Nuevo
    intentScore,       // <-- Nuevo
    abVariant,         // <-- Nuevo
} = useAdaptiveFeed({
    category: selectedCategory || undefined,
    mode: activeMenu,
    search: searchQuery,
    city: selectedCity,
    limit: 20,
});

// Opcional: Mostrar indicador de Highway activo (solo dev)
{process.env.NODE_ENV === 'development' && isHighwayActive && (
    <div className="fixed top-20 right-4 z-50 px-3 py-1 bg-venuz-pink/20 text-venuz-pink text-xs rounded-full">
        🛣️ Highway ({abVariant}) | Score: {(intentScore * 100).toFixed(0)}%
    </div>
)}

*/

// ============================================
// CÓMO CAMBIAR EL PORCENTAJE DE ROLLOUT
// ============================================
/*

En lib/featureFlags.ts, cambiar:

const ROLLOUT_CONFIG = {
    highway_algorithm: {
        ...
        percentage: 10,  // <- CAMBIAR AQUÍ
        // 10 = 10% de usuarios
        // 25 = 25% de usuarios
        // 50 = 50% de usuarios
        // 100 = todos
    },
    ...
};

*/

export default useAdaptiveFeed;
