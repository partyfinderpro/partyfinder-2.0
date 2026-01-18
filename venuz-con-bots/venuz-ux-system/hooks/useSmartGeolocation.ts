'use client';

import { useState, useEffect, useCallback } from 'react';

// ============================================
// VENUZ SMART GEOLOCATION
// ============================================
// 1. Primero: Ubicación aproximada por IP (sin permiso)
// 2. Después: Ubicación precisa con permiso (cuando usuario acepta)
// ============================================

interface Coordinates {
    latitude: number;
    longitude: number;
    accuracy: 'ip' | 'gps';
    city?: string;
    region?: string;
    country?: string;
}

interface SmartGeoState {
    coordinates: Coordinates | null;
    isLoading: boolean;
    error: string | null;
    hasGPSPermission: boolean;
    permissionStatus: 'prompt' | 'granted' | 'denied' | 'unknown';
}

// Puerto Vallarta como fallback
const FALLBACK_COORDS: Coordinates = {
    latitude: 20.6534,
    longitude: -105.2253,
    accuracy: 'ip',
    city: 'Puerto Vallarta',
    region: 'Jalisco',
    country: 'Mexico',
};

const STORAGE_KEY = 'venuz_geo_cache';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hora

export function useSmartGeolocation() {
    const [state, setState] = useState<SmartGeoState>({
        coordinates: null,
        isLoading: true,
        error: null,
        hasGPSPermission: false,
        permissionStatus: 'unknown',
    });

    const getIPLocation = useCallback(async (): Promise<Coordinates | null> => {
        const services = [
            {
                url: 'https://ipapi.co/json/',
                parse: (data: any) => ({
                    latitude: data.latitude,
                    longitude: data.longitude,
                    city: data.city,
                    region: data.region,
                    country: data.country_name,
                    accuracy: 'ip' as const,
                }),
            },
            {
                url: 'https://ip-api.com/json/?fields=lat,lon,city,regionName,country',
                parse: (data: any) => ({
                    latitude: data.lat,
                    longitude: data.lon,
                    city: data.city,
                    region: data.regionName,
                    country: data.country,
                    accuracy: 'ip' as const,
                }),
            },
            {
                url: 'https://ipwho.is/',
                parse: (data: any) => ({
                    latitude: data.latitude,
                    longitude: data.longitude,
                    city: data.city,
                    region: data.region,
                    country: data.country,
                    accuracy: 'ip' as const,
                }),
            },
        ];

        for (const service of services) {
            try {
                const response = await fetch(service.url, {
                    signal: AbortSignal.timeout(5000)
                });

                if (response.ok) {
                    const data = await response.json();
                    const coords = service.parse(data);

                    if (coords.latitude && coords.longitude) {
                        return coords;
                    }
                }
            } catch (e) {
                console.warn(`IP geolocation service failed: ${service.url}`);
                continue;
            }
        }

        return null;
    }, []);

    const getGPSLocation = useCallback((): Promise<Coordinates | null> => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: 'gps',
                    });
                },
                (error) => {
                    console.warn('GPS error:', error.message);
                    resolve(null);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000,
                }
            );
        });
    }, []);

    const checkPermissionStatus = useCallback(async () => {
        if (!navigator.permissions) return 'unknown';

        try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            return result.state;
        } catch {
            return 'unknown';
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            const cached = localStorage.getItem(STORAGE_KEY);
            if (cached) {
                try {
                    const { coords, timestamp } = JSON.parse(cached);
                    if (Date.now() - timestamp < CACHE_DURATION) {
                        setState(prev => ({
                            ...prev,
                            coordinates: coords,
                            isLoading: false,
                        }));

                        const permStatus = await checkPermissionStatus();
                        setState(prev => ({
                            ...prev,
                            permissionStatus: permStatus as any,
                            hasGPSPermission: permStatus === 'granted',
                        }));

                        return;
                    }
                } catch (e) {
                    localStorage.removeItem(STORAGE_KEY);
                }
            }

            setState(prev => ({ ...prev, isLoading: true }));

            const ipCoords = await getIPLocation();
            const coords = ipCoords || FALLBACK_COORDS;

            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                coords,
                timestamp: Date.now(),
            }));

            const permStatus = await checkPermissionStatus();

            setState({
                coordinates: coords,
                isLoading: false,
                error: null,
                permissionStatus: permStatus as any,
                hasGPSPermission: permStatus === 'granted',
            });

            if (permStatus === 'granted') {
                const gpsCoords = await getGPSLocation();
                if (gpsCoords) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({
                        coords: gpsCoords,
                        timestamp: Date.now(),
                    }));
                    setState(prev => ({
                        ...prev,
                        coordinates: gpsCoords,
                        hasGPSPermission: true,
                    }));
                }
            }
        };

        init();
    }, [getIPLocation, getGPSLocation, checkPermissionStatus]);

    const requestGPSPermission = useCallback(async (): Promise<boolean> => {
        setState(prev => ({ ...prev, isLoading: true }));

        const gpsCoords = await getGPSLocation();

        if (gpsCoords) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                coords: gpsCoords,
                timestamp: Date.now(),
            }));

            setState(prev => ({
                ...prev,
                coordinates: gpsCoords,
                isLoading: false,
                hasGPSPermission: true,
                permissionStatus: 'granted',
            }));

            return true;
        } else {
            const permStatus = await checkPermissionStatus();

            setState(prev => ({
                ...prev,
                isLoading: false,
                permissionStatus: permStatus as any,
                hasGPSPermission: false,
                error: permStatus === 'denied'
                    ? 'Permiso de ubicación denegado'
                    : 'No se pudo obtener ubicación',
            }));

            return false;
        }
    }, [getGPSLocation, checkPermissionStatus]);

    const getDistanceKm = useCallback((lat2: number, lng2: number): number | null => {
        if (!state.coordinates) return null;

        const { latitude: lat1, longitude: lng1 } = state.coordinates;
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;

        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }, [state.coordinates]);

    const formatDistance = useCallback((lat: number, lng: number): string => {
        const distance = getDistanceKm(lat, lng);
        if (distance === null) return '';

        if (distance < 1) {
            return `${Math.round(distance * 1000)}m`;
        } else if (distance < 10) {
            return `${distance.toFixed(1)}km`;
        } else {
            return `${Math.round(distance)}km`;
        }
    }, [getDistanceKm]);

    return {
        ...state,
        requestGPSPermission,
        getDistanceKm,
        formatDistance,
    };
}

export default useSmartGeolocation;
