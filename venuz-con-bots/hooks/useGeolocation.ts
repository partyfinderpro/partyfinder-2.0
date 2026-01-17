// hooks/useGeolocation.ts
'use client';

import { useState, useEffect } from 'react';

interface Coordinates {
    lat: number;
    lng: number;
}

interface GeolocationState {
    coordinates: Coordinates | null;
    error: string | null;
    loading: boolean;
    permissionDenied: boolean;
}

export function useGeolocation() {
    const [state, setState] = useState<GeolocationState>({
        coordinates: null,
        error: null,
        loading: true,
        permissionDenied: false,
    });

    useEffect(() => {
        // Intentar cargar de localStorage primero
        const cached = localStorage.getItem('venuz_user_location');
        if (cached) {
            try {
                setState({
                    coordinates: JSON.parse(cached),
                    error: null,
                    loading: false,
                    permissionDenied: false,
                });
            } catch (e) {
                localStorage.removeItem('venuz_user_location');
            }
        }

        // Automatic geolocation removed for Zero Friction UX
        // Use useSmartGeolocation from venuz-ux-system instead
        setState(prev => ({ ...prev, loading: false }));
    }, []);

    return state;
}

// Función para calcular distancia usando fórmula Haversine
export function getDistanceKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Redondear a 1 decimal
}

// Función para formatear distancia
export function formatDistance(km: number): string {
    if (km < 1) {
        return `${Math.round(km * 1000)}m`;
    }
    if (km >= 100) {
        return `${Math.round(km)}km`;
    }
    return `${km.toFixed(1)}km`;
}
