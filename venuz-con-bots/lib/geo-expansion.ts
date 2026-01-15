// lib/geo-expansion.ts

export const RADIUS_LEVELS = [
    1000,    // 1 km
    3000,    // 3 km
    5000,    // 5 km
    10000,   // 10 km
    20000,   // 20 km
    50000,   // 50 km
    100000,  // 100 km
];

export interface GeoExpansionState {
    currentRadiusIndex: number;
    currentRadius: number;
    hasMoreContent: boolean;
}

export function getNextRadius(currentIndex: number): number {
    const nextIndex = Math.min(currentIndex + 1, RADIUS_LEVELS.length - 1);
    return RADIUS_LEVELS[nextIndex];
}

export function shouldExpandRadius(
    itemsFound: number,
    minItemsPerRadius: number = 10
): boolean {
    return itemsFound < minItemsPerRadius;
}

export function formatRadiusDisplay(meters: number): string {
    if (meters < 1000) {
        return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(0)}km`;
}

export function getRadiusIndex(meters: number): number {
    const index = RADIUS_LEVELS.findIndex(r => r >= meters);
    return index === -1 ? RADIUS_LEVELS.length - 1 : index;
}
