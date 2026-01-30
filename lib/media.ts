// lib/media.ts
// Centralización de la lógica de procesamiento de medios (imágenes y videos)

export const DEFAULT_PLACEHOLDER = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800';
export const BAD_PLACEHOLDER_ID = '1557682250';

/**
 * Sanitiza una URL de imagen para manejar placeholders rotos o genéricos
 */
export const sanitizeImageUrl = (url: string | null | undefined, affiliateSource?: string, sourceUrl?: string): string => {
    if (!url || url.includes(BAD_PLACEHOLDER_ID)) {
        // Si es de porndude y tenemos el source_url, podemos intentar un screenshot
        if (affiliateSource === 'porndude' && sourceUrl) {
            // Usamos thum.io que es más fiable que WordPress mshots (que da 403)
            return `https://image.thum.io/get/width/800/noCache/${encodeURIComponent(sourceUrl)}`;
        }

        // Fallback por categoría si es posible (aunque aquí no tenemos la categoría)
        return DEFAULT_PLACEHOLDER;
    }

    // Limpieza de URLs de Google si vienen con tokens temporales o parámetros que podamos optimizar
    if (url.includes('googleusercontent.com') || url.includes('googleapis.com')) {
        // Aseguramos que el protocolo sea HTTPS
        return url.replace('http://', 'https://');
    }

    return url;
};

/**
 * Determina si una URL es propensa a fallar por hotlinking o CSP
 */
export const isProblematicSource = (url: string): boolean => {
    if (!url) return false;
    const domains = [
        'camsoda.com',
        'stripchat.com',
        'chaturbate.com',
        'googleusercontent.com',
        'googleapis.com',
        'porndude.com'
    ];
    return domains.some(d => url.includes(d));
};
