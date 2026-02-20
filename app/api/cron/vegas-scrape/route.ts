import { NextResponse } from 'next/server';
import { crawlerService } from '@/lib/vegas-strip/crawler-service';
import { aiContentAnalyzer } from '@/lib/vegas-strip/ai-analyzer';
import { linkTransformer } from '@/lib/vegas-strip/link-transformer';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { matchVibe, applyNightlifeGrade } from '@/lib/vegas-strip/visual-enhancer';

const logger = console;

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for scraping multiple sources

export async function GET() {
    const startTime = Date.now();
    const errors: string[] = [];
    let totalItems = 0;
    let totalSources = 0;

    try {
        const { data: sources, error } = await supabase
            .from('scraping_sources')
            .select('*')
            .eq('is_active', true);

        if (error) throw error;

        totalSources = sources?.length || 0;
        logger.info(`[VegasScrape] Starting scrape of ${totalSources} active sources`);

        for (const source of sources || []) {
            try {
                logger.info(`[VegasScrape] Crawling: ${source.name || source.base_url}`);
                const items = await crawlerService.crawl(source.base_url);
                logger.info(`[VegasScrape] Found ${items.length} items from ${source.name || source.base_url}`);

                for (const item of items) {
                    try {
                        // AI Analysis
                        const analysis = await aiContentAnalyzer.analyzeItem(
                            item.title,
                            item.description,
                            source.category
                        );

                        // Monetization
                        const affiliateUrl = await linkTransformer.transform(item.originalUrl);

                        // Calculate visual style (THE FIX: was {} before)
                        const vibe = matchVibe(item.title, item.description);
                        const visualStyle = applyNightlifeGrade(vibe);

                        // Insert into scraped_items (staging)
                        const { data: scrapedRecord, error: scrapeError } = await supabase.from('scraped_items').upsert({
                            source_id: source.id,
                            title: item.title,
                            rewritten_title: analysis.rewrittenTitle || item.title,
                            description: item.description,
                            rewritten_description: analysis.rewrittenDescription || item.description,
                            original_url: item.originalUrl,
                            affiliate_url: affiliateUrl,
                            hero_image_url: item.heroImageUrl,
                            gallery_urls: item.galleryUrls,
                            item_type: item.itemType,
                            category: source.category,
                            tags: analysis.suggestedTags,
                            quality_score: analysis.qualityScore || 80,
                            elegance_score: analysis.eleganceScore || 75,
                            vibe: vibe,
                            visual_style: visualStyle,
                            priority_level: Math.round((analysis.qualityScore || 80) * 0.6 + (analysis.trendingScore || 75) * 0.4),
                            is_approved: true,
                            is_published: true
                        }, { onConflict: 'original_url' }).select().single();

                        if (scrapeError) {
                            errors.push(`Insert ${item.title?.substring(0, 30)}: ${scrapeError.message}`);
                            logger.error('[VegasScrape] Insert error:', scrapeError.message);
                        } else if (scrapedRecord) {
                            // 🔥 SYNC TO MAIN CONTENT TABLE (Bridge)
                            // Now with REAL visual_style instead of empty {}
                            const { error: syncError } = await supabase.from('content').upsert({
                                title: scrapedRecord.rewritten_title || scrapedRecord.title,
                                description: scrapedRecord.rewritten_description || scrapedRecord.description,
                                image_url: scrapedRecord.hero_image_url,
                                category: scrapedRecord.category,
                                affiliate_url: scrapedRecord.affiliate_url,
                                source_url: scrapedRecord.original_url,
                                visual_style: visualStyle, // 🔥 FIX: Real VisualStyle with neonColor, cssFilter, className
                                images: scrapedRecord.gallery_urls,
                                quality_score: scrapedRecord.quality_score,
                                is_verified: true,
                                is_premium: scrapedRecord.priority_level > 8,
                                active: true,
                                location: source.city || 'Puerto Vallarta', // Inherit city from source
                            }, { onConflict: 'source_url' });

                            if (syncError) {
                                errors.push(`Sync ${item.title?.substring(0, 30)}: ${syncError.message}`);
                                logger.warn('[VegasScrape] Sync warning:', syncError.message);
                            }
                        }

                        totalItems++;
                    } catch (itemErr: any) {
                        errors.push(`Item error: ${itemErr.message}`);
                        logger.error('[VegasScrape] Item processing error:', itemErr.message);
                    }
                }

                // Rate limit: 1.5s delay between sources to avoid bans
                if (sources && sources.indexOf(source) < sources.length - 1) {
                    await new Promise(r => setTimeout(r, 1500));
                }

            } catch (sourceErr: any) {
                errors.push(`Source ${source.name || source.base_url}: ${sourceErr.message}`);
                logger.error(`[VegasScrape] Source failed: ${source.name}`, sourceErr.message);
            }
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        logger.info(`[VegasScrape] Completed in ${elapsed}s — ${totalItems} items from ${totalSources} sources`);

        return NextResponse.json({
            success: true,
            items: totalItems,
            sources: totalSources,
            elapsed: `${elapsed}s`,
            errors: errors.length > 0 ? errors.slice(0, 10) : undefined // Cap error list
        });
    } catch (err: any) {
        logger.error('[VegasScrape] Fatal error:', err.message);
        return NextResponse.json({
            success: false,
            error: err.message,
            items: totalItems,
            errors: errors.slice(0, 5)
        }, { status: 500 });
    }
}
