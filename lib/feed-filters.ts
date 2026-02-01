// lib/feed-filters.ts
// VENUZ - Filtros de calidad para eliminar contenido basura del feed
// Solicitado por: Claude + Grok | 31 Enero 2026

export const BLOCKED_SOURCES = [
    'theporndude.com',
    'theporndude',
    'porngeek.com',
    'porngeek',
    'porndude',
    'porn dude',
];

export const BLOCKED_TITLE_PATTERNS = [
    /best.*sites.*\+$/i,
    /premium.*sites.*\+$/i,
    /make money.*\+$/i,
    /other.*categories.*\+$/i,
    /top.*porn.*sites/i,
    /free.*porn.*tube/i,
    /live.*sex.*cams.*\+/i,
    /\.{3}\s*\+$/,  // Cualquier título que termine en "... +"
    /\.\.\.\s*\+$/,  // Variante con espacios
    /sex\s+chat\s+with/i,
    /nude\s+big\s+beautiful/i,
    /masturbate\s+with/i,
    /bbw.*sex.*cams/i,
    /ssbbw/i,
    /curvy.*women.*webcam/i,
    /chubby.*girls.*sex/i,
    /visit\s+live\s+bbw/i,
    /top\s+rated\s+adult/i,
];

export const BLOCKED_DESCRIPTION_PATTERNS = [
    /theporndude/i,
    /porn\s*dude/i,
    /we\s+do\s+not\s+host/i,
    /sex\s+chat\s+and\s+masturbate/i,
    /shaking\s+her\s+naked/i,
    /dirty\s+talk\s+just\s+for\s+you/i,
    /motorboat\s+until/i,
];

export const BLOCKED_URL_PATTERNS = [
    /theporndude\.com/i,
    /porngeek\.com/i,
];

export const MIN_TITLE_LENGTH = 5;
export const MAX_TRUNCATION_INDICATOR = true; // Rechazar títulos que terminan en "..."

/**
 * Verifica si un item del feed es contenido de calidad
 * Retorna TRUE si el contenido es válido, FALSE si debe ser filtrado
 * 🔥 VERSIÓN MENOS AGRESIVA - Solo bloquea basura obvia
 */
export function isQualityContent(item: any): boolean {
    const title = item.name || item.title || '';
    const description = item.description || '';
    const source = item.source_domain || item.source || item.source_url || '';
    const url = item.url || item.link || item.affiliate_url || '';
    const imageUrl = item.image_url || item.thumbnail_url || '';

    // 1. Rechazar fuentes bloqueadas
    if (BLOCKED_SOURCES.some(blockedSource =>
        source.toLowerCase().includes(blockedSource.toLowerCase())
    )) {
        return false;
    }

    // 2. Rechazar URLs bloqueadas
    if (BLOCKED_URL_PATTERNS.some(pattern => pattern.test(url))) {
        return false;
    }

    // 3. Rechazar títulos basura obvios
    if (BLOCKED_TITLE_PATTERNS.some(pattern => pattern.test(title))) {
        return false;
    }

    // 4. Rechazar descripciones basura
    if (BLOCKED_DESCRIPTION_PATTERNS.some(pattern => pattern.test(description))) {
        return false;
    }

    // 5. Verificar que no sea contenido de "lista de sitios"
    const listIndicators = ['Top Premium Porn', 'Free Porn Tube', 'Best Porn Sites', 'Live Sex Cam Sites'];
    if (listIndicators.some(indicator => title.includes(indicator))) {
        return false;
    }

    // 6. Bloquear si la imagen es de ThePornDude
    if (imageUrl && BLOCKED_SOURCES.some(src => imageUrl.toLowerCase().includes(src))) {
        return false;
    }

    // Si llegó hasta aquí, es contenido válido
    return true;
}

/**
 * Filtra un array de items del feed
 */
export function filterFeedContent<T>(items: T[]): T[] {
    const filtered = items.filter(isQualityContent);
    console.log(`[VENUZ Filter] Filtered ${items.length - filtered.length} items. Showing ${filtered.length}`);
    return filtered;
}

/**
 * Sanitiza el título para display
 */
export function sanitizeTitle(title: string): string {
    return title
        .replace(/\s*\.\.\.\s*\+?\s*$/, '') // Remover "... +" del final
        .replace(/\s*\+\s*$/, '') // Remover "+" suelto
        .trim();
}
