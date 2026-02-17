import * as cheerio from 'cheerio';
import { matchVibe, applyNightlifeGrade, type VisualStyle } from './visual-enhancer'; // Import local modules
import { linkTransformer } from './link-transformer'; // Import LinkTransformer

// import { logger } from '@/lib/logger'; // Si no existe logger, usa console
const logger = console;

export interface CrawlResult {
    title: string;
    description: string;
    heroImageUrl?: string;
    galleryUrls: string[];
    originalUrl: string;
    affiliateUrl?: string; // 🔥 New field for monetized link
    itemType: 'banner' | 'model' | 'product';
    rawJson?: any;
    vibe: string[];
    visualStyle: VisualStyle;
}

export class CrawlerService {
    async crawl(url: string, selectorConfig?: any): Promise<CrawlResult[]> {
        try {
            logger.info('[Crawler] Starting crawl for:', url);

            // Fetch HTML con headers de navegador
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
                }
            });

            if (!res.ok) {
                throw new Error(`HTTP Error ${res.status}`);
            }

            const html = await res.text();
            const $ = cheerio.load(html);

            const results: CrawlResult[] = [];

            // 1. Estrategia SPA: Buscar __NEXT_DATA__ (Next.js)
            const nextDataScript = $('#__NEXT_DATA__').html();
            let nextData: any = null;

            if (nextDataScript) {
                try {
                    nextData = JSON.parse(nextDataScript);
                    logger.info('[Crawler] 🚀 Found __NEXT_DATA__ payload (SPA Mode)');
                } catch (e) {
                    logger.warn('[Crawler] Failed to parse __NEXT_DATA__');
                }
            }

            // 2. Fallback Universal: OpenGraph Meta Tags
            const ogTitle = $('meta[property="og:title"]').attr('content') || $('title').text().trim();
            const ogImage = $('meta[property="og:image"]').attr('content');
            const ogDesc = $('meta[property="og:description"]').attr('content');

            if (ogImage && ogTitle) {
                const vibe = matchVibe(ogTitle, ogDesc || '');
                results.push({
                    title: ogTitle,
                    description: ogDesc || '',
                    heroImageUrl: this.normalizeUrl(ogImage, url),
                    galleryUrls: [this.normalizeUrl(ogImage, url)],
                    originalUrl: nextData ? url : url, // Placeholder
                    itemType: 'banner',
                    rawJson: nextData ? { _source: 'next_data' } : undefined,
                    vibe: vibe,
                    visualStyle: applyNightlifeGrade(vibe)
                });
            }

            // 3. Estrategia Heurística: Grids de Modelos/Productos
            const cardSelectors = [
                '.model-card', '.product-card', '.character-card', '.companion-card',
                'div[class*="Card"]', 'div[class*="Item"]', 'article'
            ];

            const selector = selectorConfig?.cardSelector || cardSelectors.join(', ');

            $(selector).each((i, el) => {
                if (i > 20) return;

                const $el = $(el);
                const title = $el.find('h2, h3, h4, .title, [class*="title"]').first().text().trim();
                const imgEl = $el.find('img').first();
                const img = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('srcset')?.split(' ')[0];
                const link = $el.find('a').first().attr('href') || $el.parents('a').attr('href');

                if (title && img && title.length > 2) {
                    const desc = $el.find('p, .desc, [class*="description"]').first().text().trim();
                    const vibe = matchVibe(title, desc);

                    results.push({
                        title,
                        description: desc,
                        heroImageUrl: this.normalizeUrl(img, url),
                        galleryUrls: [this.normalizeUrl(img, url)],
                        originalUrl: link ? this.normalizeUrl(link, url) : url,
                        itemType: 'model',
                        rawJson: undefined,
                        vibe: vibe,
                        visualStyle: applyNightlifeGrade(vibe)
                    });
                }
            });

            // Deduplicar resultados
            const uniqueResults = Array.from(new Map(results.map(item => [item.heroImageUrl, item])).values());
            const finalResults: CrawlResult[] = []; // Array final con tipos correctos

            // Transformar Links (Monetización)
            for (const item of uniqueResults) {
                const affUrl = await linkTransformer.transform(item.originalUrl);

                // Crear nuevo objeto con affiliateUrl inyectado
                finalResults.push({
                    ...item,
                    affiliateUrl: affUrl
                });
            }

            logger.info(`[Crawler] Finished. Found ${finalResults.length} unique monetized items.`);
            return finalResults;

        } catch (err: any) {
            logger.error('[Crawler] Failed:', err.message);
            return [];
        }
    }

    private normalizeUrl(url: string, base: string): string {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        if (url.startsWith('//')) return `https:${url}`;

        try {
            const baseUrl = new URL(base);
            if (url.startsWith('/')) {
                return `${baseUrl.protocol}//${baseUrl.host}${url}`;
            }
            return `${baseUrl.protocol}//${baseUrl.host}/${url}`;
        } catch (e) {
            return url;
        }
    }
}

export const crawlerService = new CrawlerService();
