
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Force load env
const envLoc = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

console.log(`Loading env from: ${envLoc}`);
dotenv.config({ path: envLoc });
console.log(`Loading env from: ${envPath}`);
dotenv.config({ path: envPath });

async function main() {
    console.log('🚀 Loading modules...');

    // Dynamic imports
    const { crawlerService } = await import('../lib/vegas-strip/crawler-service');
    const { aiContentAnalyzer } = await import('../lib/vegas-strip/ai-analyzer');
    const { linkTransformer } = await import('../lib/vegas-strip/link-transformer');
    const { matchVibe } = await import('../lib/vegas-strip/visual-enhancer');

    // Attempt to locate Service Role Key in messed up env vars
    let extractedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!extractedKey) {
        console.log('⚠️ SUPABASE_SERVICE_ROLE_KEY missing, searching in other variables for JWT...');
        const jwtRegex = /eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+/;

        for (const [key, val] of Object.entries(process.env)) {
            if (typeof val === 'string' && (val.includes('eyJ') || val.includes('service_role'))) {
                const match = val.match(jwtRegex);
                if (match) {
                    const jwt = match[0];
                    try {
                        // naive decode of payload
                        const parts = jwt.split('.');
                        if (parts.length === 3) {
                            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                            if (payload.role === 'service_role') {
                                console.log(`✅ FOUND Service Role Key inside ${key}!`);
                                extractedKey = jwt;
                                process.env.SUPABASE_SERVICE_ROLE_KEY = jwt;
                                break;
                            }
                        }
                    } catch (e) {
                        // ignore invalid jwt
                    }
                }
            }
        }
    }

    if (!process.env.SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    }

    // Now import supabase admin
    let supabase: any;
    try {
        const mod = await import('../lib/supabase-admin');
        supabase = mod.supabaseAdmin;
        console.log('✅ Imported supabase-admin successfully.');
    } catch (e: any) {
        console.error('⚠️ Failed to import supabase-admin:', e.message);
    }

    // Validations
    if (!process.env.SUPABASE_URL) {
        console.error('❌ No Supabase URL found (checked NEXT_PUBLIC_SUPABASE_URL too).');
        process.exit(1);
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ No Service Role Key found even after scanning.');
        process.exit(1);
    }

    console.log('📡 Fetching active scraping sources...');
    const { data: sources, error } = await supabase
        .from('scraping_sources')
        .select('*')
        .eq('is_active', true);

    if (error) {
        console.error('❌ Error fetching sources:', error);
        throw error;
    }

    console.log(`Found ${sources?.length || 0} active sources.`);

    let totalItems = 0;

    for (const source of sources || []) {
        console.log(`\n🔍 Scraping source: ${source.base_url} [${source.category}]`);
        const items = await crawlerService.crawl(source.base_url);
        console.log(`   Found ${items.length} items from ${source.base_url}`);

        for (const item of items) {
            // AI Analysis
            const analysis = await aiContentAnalyzer.analyzeItem(
                item.title,
                item.description,
                source.category
            );

            // Monetization
            const affiliateUrl = await linkTransformer.transform(item.originalUrl);

            // Manual Upsert to bypass missing unique constraint
            const { data: existing } = await supabase
                .from('scraped_items')
                .select('id')
                .eq('original_url', item.originalUrl)
                .maybeSingle();

            let upsertError;

            if (existing) {
                // Update
                const { error } = await supabase.from('scraped_items').update({
                    source_id: source.id,
                    title: item.title,
                    rewritten_title: analysis.rewrittenTitle || item.title,
                    description: item.description,
                    rewritten_description: analysis.rewrittenDescription || item.description,
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
                    is_published: true,
                    updated_at: new Date().toISOString()
                }).eq('id', existing.id);
                upsertError = error;
            } else {
                // Insert
                const { error } = await supabase.from('scraped_items').insert({
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
                });
                upsertError = error;
            }

            if (upsertError) {
                console.error(`   ❌ Failed to insert ${item.title}:`, upsertError.message);
            } else {
                process.stdout.write('.');
                totalItems++;
            }
        }
    }

    console.log(`\n\n✅ [VegasScrape] Completed - ${totalItems} items processed & synced.`);
}

main().catch(err => {
    console.error('CRASH:', err);
    process.exit(1);
});
