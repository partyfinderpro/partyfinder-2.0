
import { useState, useEffect } from 'react';

// Ciudades por defecto con coordenadas
const DEFAULT_CITIES = {
    'CDMX': { lat: 19.4326, lng: -99.1332 },
    'Guadalajara': { lat: 20.6597, lng: -103.3496 },
    'Monterrey': { lat: 25.6866, lng: -100.3161 },
    'Tulum': { lat: 20.2114, lng: -87.4654 },
    'Cancun': { lat: 21.1619, lng: -86.8515 },
    'Puerto Vallarta': { lat: 20.6534, lng: -105.2253 },
    'Miami': { lat: 25.7617, lng: -80.1918 },
    'Lisboa': { lat: 38.7223, lng: -9.1393 },
    'Madrid': { lat: 40.4168, lng: -3.7038 },
};

interface LocationState {
    city: string;
    lat: number | null;
    lng: number | null;
    error: string | null;
    isLoading: boolean;
    permissionDenied: boolean;
}

export function useSmartLocation() {
    const [location, setLocation] = useState<LocationState>({
        city: 'Todas',
        lat: null,
        lng: null,
        error: null,
        isLoading: true,
        permissionDenied: false,
    });

    const detectLocation = () => {
        setLocation(prev => ({ ...prev, isLoading: true, error: null }));

        if (!navigator.geolocation) {
            setLocation(prev => ({
                ...prev,
                isLoading: false,
                error: 'Geolocalización no soportada'
            }));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // Identificar ciudad más cercana simple
                const nearestCity = findNearestCity(latitude, longitude);

                setLocation({
                    city: nearestCity,
                    lat: latitude,
                    lng: longitude,
                    error: null,
                    isLoading: false,
                    permissionDenied: false
                });

                // Guardar preferencia
                localStorage.setItem('venuz_user_lat', latitude.toString());
                localStorage.setItem('venuz_user_lng', longitude.toString());
                localStorage.setItem('venuz_user_city', nearestCity);
            },
            (error) => {
                console.error('Error de geolocalización:', error);
                let errorMsg = 'Error al obtener ubicación';
                let denied = false;

                if (error.code === error.PERMISSION_DENIED) {
                    errorMsg = 'Permiso denegado';
                    denied = true;
                }

                // Intentar recuperar de localStorage si falló
                const savedLat = localStorage.getItem('venuz_user_lat');
                const savedLng = localStorage.getItem('venuz_user_lng');
                const savedCity = localStorage.getItem('venuz_user_city');

                if (savedLat && savedLng) {
                    setLocation({
                        city: savedCity || 'Todas',
                        lat: parseFloat(savedLat),
                        lng: parseFloat(savedLng),
                        error: null,
                        isLoading: false,
                        permissionDenied: denied
                    });
                } else {
                    setLocation(prev => ({
                        ...prev,
                        isLoading: false,
                        error: errorMsg,
                        permissionDenied: denied
                    }));
                }
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 }
        );
    };

    const setManualCity = (cityName: string) => {
        // Buscar si tenemos coords para esta ciudad
        const knownCity = DEFAULT_CITIES[cityName as keyof typeof DEFAULT_CITIES];

        const newLat = knownCity ? knownCity.lat : null;
        const newLng = knownCity ? knownCity.lng : null;

        setLocation({
            city: cityName,
            lat: newLat,
            lng: newLng,
            error: null,
            isLoading: false,
            permissionDenied: false
        });

        localStorage.setItem('venuz_user_city', cityName);
        if (newLat && newLng) {
            localStorage.setItem('venuz_user_lat', newLat.toString());
            localStorage.setItem('venuz_user_lng', newLng.toString());
        } else {
            // Si es manual y desconocida, limpiamos coords para usar búsqueda por texto
            localStorage.removeItem('venuz_user_lat');
            localStorage.removeItem('venuz_user_lng');
        }
    };

    useEffect(() => {
        // Intentar detectar al montar
        const savedLat = localStorage.getItem('venuz_user_lat');
        if (savedLat) {
            // Si ya tenemos datos, no molestamos al usuario inmediatamente, usamos caché
            const savedLng = localStorage.getItem('venuz_user_lng');
            const savedCity = localStorage.getItem('venuz_user_city');
            setLocation({
                city: savedCity || 'Todas',
                lat: parseFloat(savedLat),
                lng: parseFloat(savedLng!),
                error: null,
                isLoading: false,
                permissionDenied: false,
            });
        } else {
            detectLocation();
        }
    }, []);

    return { ...location, detectLocation, setManualCity };
}

function findNearestCity(lat: number, lng: number): string {
    let minDistance = Infinity;
    let nearest = 'Ubicación Actual';

    for (const [city, coords] of Object.entries(DEFAULT_CITIES)) {
        const d = distance(lat, lng, coords.lat, coords.lng);
        if (d < 50 && d < minDistance) { // Radio de 50km
            minDistance = d;
            nearest = city;
        }
    }

    // Si no está cerca de ninguna conocida, retornamos genérico pero las coordenadas se usarán igual
    return nearest;
}

function distance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const p = 0.017453292519943295;    // Math.PI / 180
    const c = Math.cos;
    const a = 0.5 - c((lat2 - lat1) * p) / 2 +
        c(lat1 * p) * c(lat2 * p) *
        (1 - c((lon2 - lon1) * p)) / 2;

    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}
