// ============================================
// VENUZ SCE: Conector Scraper → Cerebro Cognitivo
// /lib/cognitive-connector.ts
//
// Este módulo conecta cualquier scraper existente
// al endpoint /api/cognitive/classify
// 
// Uso desde scraper.js o cualquier cron:
//   import { classifySingle, classifyBatch } from '@/lib/cognitive-connector'
// ============================================

const CLASSIFY_URL = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/cognitive/classify`
    : 'https://partyfinder-2-0-tbf2.vercel.app/api/cognitive/classify';

interface RawScrapedItem {
    title?: string;
    description?: string;
    image_url?: string;
    images?: string[];
    source_url?: string;
    url?: string;
    lat?: number;
    lng?: number;
    category?: string;
    price?: string;
    address?: string;
    phone?: string;
    rating?: number;
    [key: string]: unknown; // Acepta cualquier campo extra
}

interface ClassifyResult {
    classification: {
        approved: boolean;
        reason: string;
        title: string;
        description: string;
        category: string;
        quality_score: number;
        is_adult: boolean;
        lat: number | null;
        lng: number | null;
    };
    action: string;
    source_scraper: string;
}

interface BatchResult {
    summary: {
        total: number;
        approved: number;
        rejected: number;
        duplicates: number;
        errors: number;
    };
    results: Array<{
        title: string;
        action: string;
        score?: number;
        category?: string;
        reason?: string;
        error?: string;
    }>;
    remaining: number;
}

/**
 * Clasificar un solo item con el cerebro cognitivo
 */
export async function classifySingle(
    rawData: RawScrapedItem,
    sourceScraper: string = 'unknown'
): Promise<ClassifyResult> {
    const response = await fetch(CLASSIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            raw_data: rawData,
            source_scraper: sourceScraper,
        }),
    });

    if (!response.ok) {
        throw new Error(`Classify failed: ${response.status} ${await response.text()}`);
    }

    return response.json();
}

/**
 * Clasificar múltiples items en batch (max 10 por llamada)
 */
export async function classifyBatch(
    items: RawScrapedItem[],
    sourceScraper: string = 'unknown'
): Promise<BatchResult> {
    const response = await fetch(CLASSIFY_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            items,
            source_scraper: sourceScraper,
        }),
    });

    if (!response.ok) {
        throw new Error(`Batch classify failed: ${response.status} ${await response.text()}`);
    }

    return response.json();
}

/**
 * Procesar un array grande de items en batches de 10
 * con delay entre batches para no saturar el API
 */
export async function classifyAll(
    items: RawScrapedItem[],
    sourceScraper: string = 'unknown',
    delayMs: number = 2000
): Promise<{
    totalProcessed: number;
    totalApproved: number;
    totalRejected: number;
    totalDuplicates: number;
    totalErrors: number;
    batches: BatchResult[];
}> {
    const batches: BatchResult[] = [];
    let totalApproved = 0;
    let totalRejected = 0;
    let totalDuplicates = 0;
    let totalErrors = 0;

    // Dividir en chunks de 10
    for (let i = 0; i < items.length; i += 10) {
        const chunk = items.slice(i, i + 10);

        try {
            const result = await classifyBatch(chunk, sourceScraper);
            batches.push(result);
            totalApproved += result.summary.approved;
            totalRejected += result.summary.rejected;
            totalDuplicates += result.summary.duplicates;
            totalErrors += result.summary.errors;

            console.log(
                `[SCE] Batch ${Math.floor(i / 10) + 1}/${Math.ceil(items.length / 10)}: ` +
                `✅${result.summary.approved} ❌${result.summary.rejected} ` +
                `🔄${result.summary.duplicates} ⚠️${result.summary.errors}`
            );
        } catch (error) {
            console.error(`[SCE] Batch ${Math.floor(i / 10) + 1} failed:`, error);
            totalErrors += chunk.length;
        }

        // Delay entre batches
        if (i + 10 < items.length) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    return {
        totalProcessed: items.length,
        totalApproved,
        totalRejected,
        totalDuplicates,
        totalErrors,
        batches,
    };
}
