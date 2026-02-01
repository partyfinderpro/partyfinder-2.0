// lib/media.ts
// Centralización de la lógica de procesamiento de medios (imágenes y videos)

export const DEFAULT_PLACEHOLDER = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800';
export const BAD_PLACEHOLDER_ID = '1557682250';

// 🔥 BLOCKED IMAGE DOMAINS - No mostrar imágenes de estas fuentes
const BLOCKED_IMAGE_DOMAINS = [
    'theporndude.com',
    'porngeek.com',
    'porndude.com',
    'cdn.theporndude.com',
    'i.theporndude.com',
];

/**
 * Sanitiza una URL de imagen para manejar placeholders rotos o genéricos
 * 🔥 AHORA TAMBIÉN BLOQUEA IMÁGENES DE THEPORNDUDE
 */
export const sanitizeImageUrl = (url: string | null | undefined, affiliateSource?: string, sourceUrl?: string): string => {
    // Si no hay URL, usar placeholder
    if (!url || url.includes(BAD_PLACEHOLDER_ID)) {
        if (affiliateSource === 'porndude' && sourceUrl) {
            return `https://image.thum.io/get/width/800/noCache/${encodeURIComponent(sourceUrl)}`;
        }
        return DEFAULT_PLACEHOLDER;
    }

    // 🔥 BLOQUEAR imágenes de ThePornDude y fuentes basura
    if (BLOCKED_IMAGE_DOMAINS.some(domain => url.toLowerCase().includes(domain))) {
        console.log(`[VENUZ Media] Blocked image from: ${url}`);
        // Intentar generar screenshot del source si existe
        if (sourceUrl) {
            return `https://image.thum.io/get/width/800/noCache/${encodeURIComponent(sourceUrl)}`;
        }
        return DEFAULT_PLACEHOLDER;
    }

    // Limpieza de URLs de Google si vienen con tokens temporales
    if (url.includes('googleusercontent.com') || url.includes('googleapis.com')) {
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
