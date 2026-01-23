// lib/geo.ts
// Sistema de detección de ubicación para México
// Código de Grok

'use client';

const MEXICO_CITIES = [
    'CDMX', 'Guadalajara', 'Monterrey', 'Cancún', 'Puerto Vallarta',
    'Tijuana', 'León', 'Puebla', 'Querétaro', 'Mérida', 'Acapulco',
    'Tulum', 'Playa del Carmen', 'Mazatlán'
];

/**
 * Detecta la ciudad del usuario mediante GPS o IP
 */
export async function detectUserCity(): Promise<string> {
    // 1. Intentar GPS (Más preciso)
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
            });

            const { latitude, longitude } = position.coords;
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`);
            const data = await response.json();

            const city = data.address?.city || data.address?.town || data.address?.state;

            if (city) {
                // Buscar coincidencia en nuestra lista
                const match = MEXICO_CITIES.find(c => city.toLowerCase().includes(c.toLowerCase()));
                if (match) return match;
            }
        } catch (e) {
            console.log('[Geo] GPS denegado o lento, usando IP...');
        }
    }

    // 2. Fallback: IP detection
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_code === 'MX' && data.city) {
            const match = MEXICO_CITIES.find(c => data.city.toLowerCase().includes(c.toLowerCase()));
            return match || 'CDMX';
        }
    } catch (e) {
        console.log('[Geo] IP detection falló');
    }

    return 'CDMX'; // Por defecto
}

/**
 * Persistencia de ciudad en LocalStorage
 */
export function saveUserCity(city: string) {
    if (typeof window !== 'undefined') {
        localStorage.setItem('venuz_user_city', city);
    }
}

export function getStoredCity(): string {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('venuz_user_city') || 'CDMX';
    }
    return 'CDMX';
}
