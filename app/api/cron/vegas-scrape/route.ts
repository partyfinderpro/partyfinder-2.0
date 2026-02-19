import { NextResponse } from 'next/server';
import { crawlerService } from '@/lib/vegas-strip/crawler-service';
import { aiContentAnalyzer } from '@/lib/vegas-strip/ai-analyzer';
import { linkTransformer } from '@/lib/vegas-strip/link-transformer';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
// import { logger } from '@/lib/logger';
const logger = console;
import { matchVibe } from '@/lib/vegas-strip/visual-enhancer';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data: sources, error } = await supabase
            .from('scraping_sources')
            .select('*')
            .eq('is_active', true);

        if (error) throw error;

        let totalItems = 0;

        for (const source of sources || []) {
            const items = await crawlerService.crawl(source.base_url);

            for (const item of items) {
                // AI Analysis (using Stub/Mock)
                const analysis = await aiContentAnalyzer.analyzeItem(
                    item.title,
                    item.description,
                    source.category
                );

                // Monetization
                const affiliateUrl = await linkTransformer.transform(item.originalUrl);

                // Insert into scraped_items
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
                    vibe: matchVibe(item.title, item.description),
                    priority_level: Math.round((analysis.qualityScore || 80) * 0.6 + (analysis.trendingScore || 75) * 0.4),
                    is_approved: true,
                    is_published: true
                }, { onConflict: 'original_url' }).select().single();

                if (scrapeError) {
                    logger.error('[VegasScrape] Error inserting scraped item', scrapeError);
                } else if (scrapedRecord) {
                    // SYNC TO MAIN CONTENT TABLE (Temporary Bridge)
                    // This ensures content appears in the feed immediately even if the new engine isn't fully integrated
                    await supabase.from('content').upsert({
                        title: scrapedRecord.rewritten_title || scrapedRecord.title,
                        description: scrapedRecord.rewritten_description || scrapedRecord.description,
                        image_url: scrapedRecord.hero_image_url,
                        category: scrapedRecord.category,
                        affiliate_url: scrapedRecord.affiliate_url,
                        source_url: scrapedRecord.original_url,
                        visual_style: {}, // Ensure not null
                        images: scrapedRecord.gallery_urls,
                        quality_score: scrapedRecord.quality_score, // Map score
                        is_verified: true, // Mark as verified since it comes from trusted source
                        is_premium: false,
                        active: true,
                        // Add a special marker for scraped content if schema allows, or use source_url filtering
                    }, { onConflict: 'source_url' }); // Assuming source_url is unique or we use another conflict target if needed
                }

                totalItems++;
            }
        }

        logger.info(`[VegasScrape] Completed - ${totalItems} items processed`);
        return NextResponse.json({ success: true, items: totalItems });
    } catch (err: any) {
        logger.error('[VegasScrape] Failed', err.message);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
