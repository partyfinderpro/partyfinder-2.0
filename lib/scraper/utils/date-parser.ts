// lib/scraper/utils/date-parser.ts
// Versión Grok v4.0 - Parser de fechas en español ultra robusto

export interface ParsedDate {
    date: string; // YYYY-MM-DD
    time?: string; // HH:MM:SS
}

/**
 * Parsea fechas en español con múltiples formatos
 * Retorna null si no puede parsear
 */
export function parseDateSpanish(dateStr: string): ParsedDate | null {
    if (!dateStr || typeof dateStr !== 'string') return null;

    const cleaned = dateStr.toLowerCase().replace(/\s+/g, ' ').trim();

    const meses: Record<string, string> = {
        'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
        'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
        'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12',
        'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04',
        'may': '05', 'jun': '06', 'jul': '07', 'ago': '08',
        'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12',
    };

    // 1. Formato Mazatlán: "12 febrero, 2026 - 02:00 pm"
    const mazMatch = cleaned.match(/(\d{1,2})\s+([a-z]+),?\s*(\d{4})\s*-?\s*(\d{1,2}):(\d{2})\s*(am|pm)?/i);
    if (mazMatch) {
        const day = mazMatch[1].padStart(2, '0');
        const month = meses[mazMatch[2]] || '01';
        const year = mazMatch[3];
        let hour = parseInt(mazMatch[4]);
        const min = mazMatch[5];
        const meridiem = mazMatch[6]?.toLowerCase();

        if (meridiem === 'pm' && hour < 12) hour += 12;
        if (meridiem === 'am' && hour === 12) hour = 0;

        return {
            date: `${year}-${month}-${day}`,
            time: `${hour.toString().padStart(2, '0')}:${min}:00`
        };
    }

    // 2. "15 de febrero de 2026" o "15 febrero 2026"
    const fullMatch = cleaned.match(/(\d{1,2})\s+(?:de\s+)?([a-z]+)\s+(?:de\s+)?(\d{4})/i);
    if (fullMatch) {
        const day = fullMatch[1].padStart(2, '0');
        const month = meses[fullMatch[2]] || '01';
        const year = fullMatch[3];
        return { date: `${year}-${month}-${day}` };
    }

    // 3. "15/02/2026" o "15-02-2026"
    const slashMatch = cleaned.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (slashMatch) {
        let [_, d, m, y] = slashMatch;
        // Swap si parece día/mes invertido
        if (parseInt(m) > 12) [d, m] = [m, d];
        return { date: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` };
    }

    // 4. ISO format: "2026-02-15"
    const isoMatch = cleaned.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (isoMatch) {
        return {
            date: `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`
        };
    }

    // 5. "Sábado 15 de febrero" (sin año → asumir año actual o próximo)
    const dayOnly = cleaned.match(/(\d{1,2})\s+(?:de\s+)?([a-z]+)/i);
    if (dayOnly) {
        const day = dayOnly[1].padStart(2, '0');
        const month = meses[dayOnly[2]] || '01';
        const year = new Date().getFullYear();
        return { date: `${year}-${month}-${day}` };
    }

    // 6. Último intento: buscar cualquier patrón de fecha
    const anyDateMatch = cleaned.match(/(\d{1,2})[^\d]+(\d{1,2})[^\d]+(\d{2,4})/);
    if (anyDateMatch) {
        let [_, a, b, c] = anyDateMatch;
        let year = c.length === 2 ? `20${c}` : c;
        let day = a, month = b;

        // Si b parece mes (1-12), asumimos formato día/mes/año
        if (parseInt(b) <= 12 && parseInt(a) > 12) {
            [day, month] = [month, day];
        }

        return { date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` };
    }

    return null;
}

/**
 * Valida que una fecha sea válida y no muy antigua/futura
 */
export function isValidEventDate(dateStr: string): boolean {
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        const twoYearsAhead = new Date();
        twoYearsAhead.setFullYear(now.getFullYear() + 2);

        return date >= oneYearAgo && date <= twoYearsAhead;
    } catch {
        return false;
    }
}
