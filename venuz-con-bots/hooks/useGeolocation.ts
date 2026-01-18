import { useState, useEffect } from 'react';

interface GeolocationState {
    latitude: number | null;
    longitude: number | null;
    error: string | null;
    loading: boolean;
    permissionDenied: boolean;
}

export const useGeolocation = (enabled: boolean = true) => {
    const [state, setState] = useState<GeolocationState>({
        latitude: null,
        longitude: null,
        error: null,
        loading: enabled,
        permissionDenied: false,
    });

    useEffect(() => {
        if (!enabled) {
            setState(prev => ({ ...prev, loading: false }));
            return;
        }

        if (!navigator.geolocation) {
            setState({
                latitude: null,
                longitude: null,
                error: 'Geolocalización no soportada',
                loading: false,
                permissionDenied: true,
            });
            return;
        }

        setState(prev => ({ ...prev, loading: true }));

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setState({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    error: null,
                    loading: false,
                    permissionDenied: false,
                });
            },
            (error) => {
                let errorMessage = 'Error obteniendo ubicación';
                let isDenied = false;

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Permiso de ubicación denegado';
                        isDenied = true;
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Ubicación no disponible';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Timeout obteniendo ubicación';
                        break;
                }

                setState({
                    latitude: null,
                    longitude: null,
                    error: errorMessage,
                    loading: false,
                    permissionDenied: isDenied,
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000, // Cache 5 minutos
            }
        );
    }, []);

    return state;
};
