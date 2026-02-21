
import { crawlerService } from '../lib/vegas-strip/crawler-service';
import { aiContentAnalyzer } from '../lib/vegas-strip/ai-analyzer';
import { linkTransformer } from '../lib/vegas-strip/link-transformer';
import { supabaseAdmin as supabase } from '../lib/supabase-admin';
import { matchVibe, applyNightlifeGrade } from '../lib/vegas-strip/visual-enhancer';

// Mock logger
const logger = console;

(async () => {
    try {
        console.log(`⚡ Force Scrape [ATTEMPT 6] - onConflict fix...`);

        // 0. Force Activate Candy AI just in case
        const { error: activeErr } = await supabase
            .from('scraping_sources')
            .update({ is_active: true })
            .eq('base_url', 'https://candy.ai/es');

        if (activeErr) console.error("Activation Error:", activeErr);

        // 1. Get Sources
        const { data: sources, error } = await supabase.from('scraping_sources').select('*');
        if (error) { console.error("DB Select Error:", error); return; }

        console.log(`Found ${sources?.length || 0} total.`);

        for (const source of sources || []) {
            if (!source.base_url.includes('candy')) continue;

            console.log(`🕷 Crawling ${source.name}...`);
            const items = await crawlerService.crawl(source.base_url);
            console.log(`📦 Found ${items.length} raw items.`);

            for (const item of items) {
                const analysis = await aiContentAnalyzer.analyzeItem(item.title, item.description, source.category);
                const affUrl = await linkTransformer.transform(item.originalUrl);
                const vibe = matchVibe(item.title, item.description);
                // const visual = applyNightlifeGrade(vibe); // Skip for schema safety

                // 1. Insert Scraped Item
                // Try simpler upsert relying on PK if possible, or composite constraint
                const { data: saved, error } = await supabase.from('scraped_items').upsert({
                    source_id: source.id,
                    title: item.title,
                    rewritten_title: analysis.rewrittenTitle,
                    description: item.description,
                    rewritten_description: analysis.rewrittenDescription,
                    original_url: item.originalUrl,
                    affiliate_url: affUrl,
                    hero_image_url: item.heroImageUrl,
                    gallery_urls: item.galleryUrls,
                    item_type: item.itemType,
                    vibe,
                    // visual_style: visual, 
                    quality_score: analysis.qualityScore,
                    priority_level: 9,
                    is_published: true, is_approved: true
                }, { onConflict: 'original_url' }).select().single();

                if (error) {
                    console.error('Insert Error:', error.message);
                    // Fallback: try blindly inserting without onConflict (might create dupes but whatever)
                    // Or try updating by ID? No ID known.
                    continue;
                }

                // 2. Sync to Main Content
                if (saved) {
                    const { error: syncError } = await supabase.from('content').upsert({
                        title: saved.rewritten_title || item.title,
                        description: saved.rewritten_description || item.description,
                        image_url: saved.hero_image_url,
                        category: saved.category,
                        affiliate_url: saved.affiliate_url,
                        source_url: saved.original_url,
                        // visual_style: visual, 
                        images: saved.gallery_urls,
                        quality_score: saved.quality_score, // Number
                        is_verified: true, active: true,
                        location: 'Las Vegas Strip',
                        is_premium: true,
                        pillar: 'adult'
                    }, { onConflict: 'source_url' });

                    if (syncError) console.error('Sync Error:', syncError.message);
                    else console.log(`✅ Synced to Content: ${saved.id}`);
                }
            }
        }
        console.log('🏁 Scrape Complete!');

    } catch (e) {
        console.error('Fatal in run:', e);
    }
})();
