import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Convierte una URL de imagen externa a usar nuestro proxy
 * para evitar errores 403 de hotlinking en webcams.
 * 
 * @param url - URL original de la imagen
 * @returns URL con proxy o URL original si no necesita proxy
 */
export function proxyImageUrl(url: string): string {
    // No proxy para URLs vacías, locales o Unsplash (ya funcionan bien)
    if (!url || url.startsWith('/') || url.includes('unsplash.com')) {
        return url;
    }

    // Dominios que necesitan proxy
    const needsProxy = [
        'strpchat.com',
        'mmcdn.com',
        'highwebmedia.com',
        'camsoda.com',
        'eporner.com',
        'pornpics.com',
        'redgifs.com',
    ];

    const requiresProxy = needsProxy.some(domain => url.includes(domain));

    if (requiresProxy) {
        return `/api/image-proxy?url=${encodeURIComponent(url)}`;
    }

    return url;
}
