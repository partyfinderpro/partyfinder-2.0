const { ApifyClient } = require('apify-client');
require('dotenv').config();

/**
 * THE APIFY HUNTER: Real Data Extraction
 * Uses Apify Actors to get REAL content at scale
 */

const apifyToken = process.env.APIFY_TOKEN;

if (!apifyToken) {
    console.error("⚠️ [Apify Hunter] No APIFY_TOKEN in .env");
}

const client = apifyToken ? new ApifyClient({ token: apifyToken }) : null;

const ApifyHunter = {
    name: "Apify Hunter",

    async scrapeGooglePlaces(query = "nightclub", location = "Puerto Vallarta, Mexico", limit = 100) {
        if (!client) {
            console.warn(`⚠️ [${this.name}] Apify not configured`);
            return [];
        }

        console.log(`🎯 [${this.name}] Searching Google Places: "${query}" in ${location}...`);

        try {
            // Actor: compass/crawler-google-places
            const run = await client.actor("compass/crawler-google-places").call({
                searchStringsArray: [query],
                locationQuery: location,
                maxCrawledPlacesPerSearch: limit,
                language: "es",
                maxImages: 3
            });

            const { items } = await client.dataset(run.defaultDatasetId).listItems();

            console.log(`✅ [${this.name}] Got ${items.length} places from Google`);

            return items.map(place => ({
                title: place.title || place.name,
                description: place.description || place.categoryName || '',
                image_url: place.imageUrls?.[0] || null,
                images: place.imageUrls || [],
                source_url: place.url || place.googleMapsUrl,
                location: place.address,
                rating: place.totalScore,
                category: 'club', // Default, can map based on categoryName
                tags: [location, query, place.categoryName].filter(Boolean),
                latitude: place.location?.lat,
                longitude: place.location?.lng,
                is_verified: true,
                views: place.reviewsCount || 0,
                active: true
            }));
        } catch (err) {
            console.error(`❌ [${this.name}] Google Places error:`, err.message);
            return [];
        }
    },

    async scrapeInstagram(hashtag = "puertovallartanightlife", limit = 50) {
        if (!client) return [];

        console.log(`📸 [${this.name}] Scraping Instagram #${hashtag}...`);

        try {
            const run = await client.actor("apify/instagram-hashtag-scraper").call({
                hashtags: [hashtag],
                resultsLimit: limit
            });

            const { items } = await client.dataset(run.defaultDatasetId).listItems();

            console.log(`✅ [${this.name}] Got ${items.length} Instagram posts`);

            return items.map(post => ({
                title: (post.caption || "").substring(0, 100),
                description: post.caption,
                image_url: post.displayUrl,
                video_url: post.videoUrl || null,
                source_url: post.url,
                category: 'evento',
                tags: post.hashtags || [],
                likes: post.likesCount,
                views: post.videoViewCount || 0,
                active: true
            }));
        } catch (err) {
            console.error(`❌ [${this.name}] Instagram error:`, err.message);
            return [];
        }
    },

    async scrapeWebcams(site = "chaturbate", limit = 100) {
        if (!client) return [];

        console.log(`🔞 [${this.name}] Scraping webcam site: ${site}...`);

        try {
            // Actor: curious_coder/chaturbate-scraper (example)
            const run = await client.actor("curious_coder/chaturbate-scraper").call({
                maxItems: limit
            });

            const { items } = await client.dataset(run.defaultDatasetId).listItems();

            console.log(`✅ [${this.name}] Got ${items.length} webcam models`);

            return items.map(model => ({
                title: model.username || model.name,
                description: model.bio || model.room_subject || '',
                image_url: model.image_url || model.thumbnail,
                source_url: model.url,
                affiliate_url: model.url, // Can add tracking later
                affiliate_source: site,
                category: 'webcam',
                viewers_now: model.viewers || model.num_users,
                is_premium: false,
                active: true
            }));
        } catch (err) {
            console.error(`❌ [${this.name}] Webcam error:`, err.message);
            return [];
        }
    },

    // Main scrape function that runs all sources
    async scrapeAll() {
        const results = [];

        // Google Places - Multiple queries
        const placeQueries = [
            { query: "nightclub", location: "Puerto Vallarta, Mexico" },
            { query: "bar lounge", location: "Puerto Vallarta, Mexico" },
            { query: "strip club", location: "Puerto Vallarta, Mexico" },
            { query: "nightclub", location: "Guadalajara, Mexico" },
            { query: "antro", location: "Ciudad de Mexico" }
        ];

        for (const pq of placeQueries) {
            const places = await this.scrapeGooglePlaces(pq.query, pq.location, 50);
            results.push(...places);
        }

        // Instagram hashtags
        const hashtags = ["puertovallartanightlife", "nightlifemexico", "clubspv"];
        for (const tag of hashtags) {
            const posts = await this.scrapeInstagram(tag, 30);
            results.push(...posts);
        }

        // Webcams (if actor available)
        // const cams = await this.scrapeWebcams("chaturbate", 100);
        // results.push(...cams);

        console.log(`\n📊 [${this.name}] TOTAL: ${results.length} items collected from Apify`);
        return results;
    }
};

module.exports = ApifyHunter;
