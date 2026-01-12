/**
 * VENUZ Image Optimizer - Selección y optimización de imágenes
 */

interface ImageSource {
    url: string;
    width?: number;
    height?: number;
    source: 'google' | 'foursquare' | 'yelp';
}

/**
 * Construye URL optimizada de Google Places Photo
 */
export function getOptimizedGooglePhoto(
    photoReference: string,
    apiKey: string,
    maxWidth: number = 800
): string {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`;
}

/**
 * Construye URL optimizada de Foursquare Photo
 */
export function getOptimizedFoursquarePhoto(
    prefix: string,
    suffix: string,
    size: string = '800x600'
): string {
    return `${prefix}${size}${suffix}`;
}

/**
 * Optimiza URL de Yelp (ya vienen optimizadas)
 */
export function getOptimizedYelpPhoto(url: string): string {
    // Yelp ya sirve imágenes optimizadas, solo aseguramos HTTPS
    return url.replace('http://', 'https://');
}

/**
 * Selecciona la mejor imagen de múltiples fuentes
 */
export function selectBestImage(images: ImageSource[]): string | null {
    if (images.length === 0) return null;

    // Prioridad: Google Places > Foursquare > Yelp
    const priorities = {
        google: 3,
        foursquare: 2,
        yelp: 1
    };

    // Ordenar por fuente y luego por resolución
    const sorted = images.sort((a, b) => {
        // Primero por prioridad de fuente
        const priorityDiff = priorities[b.source] - priorities[a.source];
        if (priorityDiff !== 0) return priorityDiff;

        // Luego por resolución (mayor = mejor)
        const aResolution = (a.width || 0) * (a.height || 0);
        const bResolution = (b.width || 0) * (b.height || 0);
        return bResolution - aResolution;
    });

    return sorted[0]?.url || null;
}

/**
 * Procesa array de fotos de Google Places
 */
export function processGooglePhotos(
    photos: any[] = [],
    apiKey: string,
    limit: number = 5
): { primary: string | null; additional: string[] } {
    if (!photos || photos.length === 0) {
        return { primary: null, additional: [] };
    }

    const optimized = photos
        .slice(0, limit)
        .map((photo: any) => getOptimizedGooglePhoto(photo.photo_reference, apiKey));

    return {
        primary: optimized[0] || null,
        additional: optimized.slice(1)
    };
}

/**
 * Procesa array de fotos de Foursquare
 */
export function processFoursquarePhotos(
    photos: any[] = [],
    limit: number = 5
): { primary: string | null; additional: string[] } {
    if (!photos || photos.length === 0) {
        return { primary: null, additional: [] };
    }

    const optimized = photos
        .slice(0, limit)
        .map((photo: any) => getOptimizedFoursquarePhoto(photo.prefix, photo.suffix));

    return {
        primary: optimized[0] || null,
        additional: optimized.slice(1)
    };
}

/**
 * Procesa fotos de Yelp
 */
export function processYelpPhotos(
    photos: string[] = [],
    limit: number = 5
): { primary: string | null; additional: string[] } {
    if (!photos || photos.length === 0) {
        return { primary: null, additional: [] };
    }

    const optimized = photos
        .slice(0, limit)
        .map(url => getOptimizedYelpPhoto(url));

    return {
        primary: optimized[0] || null,
        additional: optimized.slice(1)
    };
}

/**
 * Genera placeholder mientras carga la imagen real
 */
export function getImagePlaceholder(category: string): string {
    const placeholders: Record<string, string> = {
        nightlife: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800&q=80',
        food: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
        hospitality: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
        medical: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
        transport: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80',
        culture: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
        event: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80'
    };

    return placeholders[category] || placeholders.culture;
}
