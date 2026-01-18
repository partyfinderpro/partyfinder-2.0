// lib/geo-expansion.ts
// Sistema de expansión radial inteligente para VENUZ

export const RADIUS_LEVELS = [
    1000,    // 1 km
    3000,    // 3 km
    5000,    // 5 km
    10000,   // 10 km
    20000,   // 20 km
    50000,   // 50 km
    100000,  // 100 km
] as const;

export type RadiusLevel = typeof RADIUS_LEVELS[number];

export interface GeoExpansionState {
    currentRadiusIndex: number;
    currentRadius: number;
    hasMoreContent: boolean;
    totalItemsLoaded: number;
}

/**
 * Obtiene el siguiente nivel de radio
 */
export function getNextRadius(currentIndex: number): { radius: number; index: number } {
    const nextIndex = Math.min(currentIndex + 1, RADIUS_LEVELS.length - 1);
    return {
        radius: RADIUS_LEVELS[nextIndex],
        index: nextIndex
    };
}

/**
 * Determina si debemos expandir el radio basado en items encontrados
 */
export function shouldExpandRadius(
    itemsFound: number,
    minItemsPerRadius: number = 5,
    currentRadiusIndex: number
): boolean {
    // No expandir si ya estamos en el máximo
    if (currentRadiusIndex >= RADIUS_LEVELS.length - 1) return false;
    // Expandir si encontramos muy pocos items
    return itemsFound < minItemsPerRadius;
}

/**
 * Formatea el radio para mostrar al usuario
 */
export function formatRadiusDisplay(meters: number): string {
    if (meters < 1000) {
        return `${meters}m`;
    }
    const km = meters / 1000;
    return km >= 10 ? `${Math.round(km)}km` : `${km.toFixed(1)}km`;
}

/**
 * Calcula la distancia entre dos puntos (Haversine)
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Estado inicial para el sistema de expansión
 */
export function createInitialGeoState(): GeoExpansionState {
    return {
        currentRadiusIndex: 0,
        currentRadius: RADIUS_LEVELS[0],
        hasMoreContent: true,
        totalItemsLoaded: 0
    };
}
