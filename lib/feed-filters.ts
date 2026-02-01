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
 */
export function isQualityContent(item: any): boolean {
    const title = item.name || item.title || '';
    const description = item.description || '';
    const source = item.source_domain || item.source || item.source_url || '';
    const url = item.url || item.link || item.affiliate_url || '';

    // 1. Rechazar fuentes bloqueadas
    if (BLOCKED_SOURCES.some(blockedSource =>
        source.toLowerCase().includes(blockedSource.toLowerCase())
    )) {
        console.log(`[VENUZ Filter] Blocked source: ${source}`);
        return false;
    }

    // 2. Rechazar URLs bloqueadas
    if (BLOCKED_URL_PATTERNS.some(pattern => pattern.test(url))) {
        console.log(`[VENUZ Filter] Blocked URL pattern: ${url}`);
        return false;
    }

    // 3. Rechazar títulos basura
    if (BLOCKED_TITLE_PATTERNS.some(pattern => pattern.test(title))) {
        console.log(`[VENUZ Filter] Blocked title pattern: ${title}`);
        return false;
    }

    // 4. Rechazar descripciones basura
    if (BLOCKED_DESCRIPTION_PATTERNS.some(pattern => pattern.test(description))) {
        console.log(`[VENUZ Filter] Blocked description pattern`);
        return false;
    }

    // 5. Rechazar títulos muy cortos
    if (title.length < MIN_TITLE_LENGTH) {
        console.log(`[VENUZ Filter] Title too short: ${title}`);
        return false;
    }

    // 6. Rechazar títulos truncados (terminan en "..." o "+ ")
    if (title.endsWith('...') || title.endsWith('... +') || title.endsWith('...+')) {
        console.log(`[VENUZ Filter] Truncated title: ${title}`);
        return false;
    }

    // 7. Rechazar items sin categoría válida
    if (!item.category && !item.categories) {
        console.log(`[VENUZ Filter] No category`);
        return false;
    }

    // 8. Verificar que no sea contenido de "lista de sitios"
    const listIndicators = ['Top Premium', 'Free Porn', 'Best Porn', 'Live Sex Cam Sites'];
    if (listIndicators.some(indicator => title.includes(indicator))) {
        console.log(`[VENUZ Filter] List content blocked: ${title}`);
        return false;
    }

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
