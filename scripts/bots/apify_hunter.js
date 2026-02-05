const { ApifyClient } = require('apify-client');
require('dotenv').config();

/**
 * APIFY HUNTER V2 - Configurado con búsquedas reales de VENUZ
 * Hashtags y queries basados en SCRAPERS_SETUP.md
 */

const APIFY_TOKEN = process.env.APIFY_TOKEN;

if (!APIFY_TOKEN) {
    console.warn("⚠️ [Apify Hunter] No APIFY_TOKEN in .env - Skipping Apify scraping");
}

const client = APIFY_TOKEN ? new ApifyClient({ token: APIFY_TOKEN }) : null;

// ========================================
// CONFIGURACIÓN DE BÚSQUEDAS VENUZ (EL PREGONERO DIGITAL)
// ========================================

const CONFIG = {
    // Instagram Hashtags - NIGHTLIFE & PARTY FOCUSED (High Value)
    instagramHashtags: [
        'puertovallartanightlife',
        'antrosgdl',
        'fiestacdmx',
        'mexicoparty',
        'cancunnightlife',
        'tulumparty',
        'playadelcarmenparty',
        'springbreakmexico'
    ],

    // Ciudades objetivo
    cities: [
        'Puerto Vallarta, Mexico',
        'Guadalajara, Mexico',
        'Ciudad de Mexico',
        'Cancun, Mexico',
        'Tulum, Mexico'
    ],

    // Queries para búsquedas - CLUB & EVENTS
    searchQueries: [
        'beach club party',
        'antro promociones',
        'ladies night vallarta',
        'dj set tonight',
        'barra libre hoy',
        'fiesta de espuma'
    ]
};

// ========================================
// SCRAPERS
// ========================================

const ApifyHunter = {
    name: "Apify Hunter V2",

    /**
     * Instagram Hashtag Scraper
     * Actor: apify/instagram-hashtag-scraper
     */
    async scrapeInstagram(limit = 10) {
        if (!client) {
            console.warn(`⚠️ [${this.name}] Apify not configured, skipping Instagram`);
            return [];
        }

        console.log(`\n📸 [${this.name}] Starting Instagram scrape (Economy Mode)...`);
        const results = [];

        // ECONOMY: Only scrape top 3 hashtags to save credits
        // We can rotate these or randomize them in the future if needed
        const activeHashtags = CONFIG.instagramHashtags.slice(0, 3);

        for (const hashtag of activeHashtags) {
            try {
                console.log(`   Scraping #${hashtag} (Limit: ${limit})...`);

                const run = await client.actor("apify/instagram-hashtag-scraper").call({
                    hashtags: [hashtag],
                    resultsLimit: limit,
                    resultsType: "posts"
                }, {
                    waitSecs: 120 // Wait up to 2 minutes
                });

                const { items } = await client.dataset(run.defaultDatasetId).listItems();

                console.log(`   ✅ Got ${items.length} posts from #${hashtag}`);

                items.forEach(post => {
                    results.push({
                        title: (post.caption || post.alt || "").substring(0, 100),
                        description: post.caption || '',
                        image_url: post.displayUrl || post.url,
                        video_url: post.videoUrl || null,
                        source_url: post.url || `https://instagram.com/p/${post.shortCode}`,
                        source_site: 'Instagram',
                        category: 'evento',
                        type: 'social',
                        tags: [hashtag, 'instagram', ...(post.hashtags || []).slice(0, 5)],
                        likes: post.likesCount || 0,
                        views: post.videoViewCount || 0,
                        active: true
                    });
                });

                // Rate limit protection
                await new Promise(r => setTimeout(r, 2000));

            } catch (err) {
                console.error(`   ❌ Error with #${hashtag}:`, err.message);
            }
        }

        console.log(`📸 [${this.name}] Instagram TOTAL: ${results.length} posts`);
        return results;
    },

    /**
     * Facebook Events Scraper (if available)
     * Note: Facebook is restrictive, this may require specific actor
     */
    async scrapeFacebookEvents(limit = 20) {
        if (!client) return [];

        console.log(`\n📘 [${this.name}] Starting Facebook Events scrape...`);
        const results = [];

        const queries = [
            'clubs puerto vallarta',
            'eventos puerto vallarta',
            'nightlife vallarta',
            'fiestas puerto vallarta',
            'fiestas guadalajara',
            'antros cdmx'
        ];

        for (const query of queries.slice(0, 3)) {
            try {
                console.log(`   Searching: "${query}"...`);

                // Try Facebook Pages scraper as alternative
                const run = await client.actor("apify/facebook-pages-scraper").call({
                    startUrls: [{ url: `https://www.facebook.com/search/pages/?q=${encodeURIComponent(query)}` }],
                    maxPagesPerQuery: limit
                }, {
                    waitSecs: 120
                });

                const { items } = await client.dataset(run.defaultDatasetId).listItems();
                console.log(`   ✅ Got ${items.length} results for "${query}"`);

                items.forEach(page => {
                    results.push({
                        title: page.name || page.title,
                        description: page.about || page.description || '',
                        image_url: page.profilePic || page.coverPhoto,
                        source_url: page.url || page.pageUrl,
                        source_site: 'Facebook',
                        category: 'club',
                        type: 'venue',
                        tags: [query, 'facebook'],
                        active: true
                    });
                });

                await new Promise(r => setTimeout(r, 2000));

            } catch (err) {
                console.error(`   ❌ Error with "${query}":`, err.message);
            }
        }

        console.log(`📘 [${this.name}] Facebook TOTAL: ${results.length} pages/events`);
        return results;
    },

    /**
     * TikTok Scraper
     * Actor: clockworks/tiktok-scraper
     */
    async scrapeTikTok(limit = 30) {
        if (!client) return [];

        console.log(`\n🎵 [${this.name}] Starting TikTok scrape...`);
        const results = [];

        const hashtags = ['puertovallarta', 'nightlifemexico', 'antrosmexico', 'fiestasmexico'];

        for (const hashtag of hashtags.slice(0, 2)) {
            try {
                console.log(`   Scraping #${hashtag}...`);

                const run = await client.actor("clockworks/tiktok-scraper").call({
                    hashtags: [hashtag],
                    resultsPerPage: limit,
                    shouldDownloadVideos: false
                }, {
                    waitSecs: 120
                });

                const { items } = await client.dataset(run.defaultDatasetId).listItems();
                console.log(`   ✅ Got ${items.length} videos from #${hashtag}`);

                items.forEach(video => {
                    results.push({
                        title: (video.text || video.desc || "").substring(0, 100),
                        description: video.text || video.desc || '',
                        image_url: video.covers?.default || video.cover,
                        video_url: video.videoUrl || video.playAddr,
                        source_url: video.webVideoUrl || `https://tiktok.com/@${video.author?.uniqueId}/video/${video.id}`,
                        source_site: 'TikTok',
                        category: 'evento',
                        type: 'video',
                        tags: [hashtag, 'tiktok', ...(video.challenges || []).map(c => c.title).slice(0, 3)],
                        likes: video.diggCount || 0,
                        views: video.playCount || 0,
                        active: true
                    });
                });

                await new Promise(r => setTimeout(r, 2000));

            } catch (err) {
                console.error(`   ❌ Error with #${hashtag}:`, err.message);
            }
        }

        console.log(`🎵 [${this.name}] TikTok TOTAL: ${results.length} videos`);
        return results;
    },

    /**
     * Main scrape function - runs all Apify sources
     */
    async scrapeAll() {
        if (!client) {
            console.log(`⚠️ [${this.name}] Apify not configured. Skipping all Apify scrapers.`);
            return [];
        }

        console.log(`\n${'='.repeat(50)}`);
        console.log(`🎯 [${this.name}] STARTING APIFY MASS COLLECTION`);
        console.log(`${'='.repeat(50)}`);

        const results = [];

        // Instagram (most reliable) - Limit 12 total across hashtags
        const instagram = await this.scrapeInstagram(12);
        results.push(...instagram);

        // TikTok (if actor available)
        // const tiktok = await this.scrapeTikTok(20);
        // results.push(...tiktok);

        // Facebook (tricky, may fail)
        // const facebook = await this.scrapeFacebookEvents(10);
        // results.push(...facebook);

        console.log(`\n${'='.repeat(50)}`);
        console.log(`📊 [${this.name}] APIFY COLLECTION COMPLETE: ${results.length} items`);
        console.log(`${'='.repeat(50)}\n`);

        return results;
    }
};

module.exports = ApifyHunter;
