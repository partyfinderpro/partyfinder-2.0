const axios = require('axios');

/**
 * THE SEDUCER: Social & Adult Content Agent (UPDATED V2)
 * Scrapes Reddit (Free API-less JSON) & Handles Video/Affiliates
 */
const TheSeducer = {
    name: "The Seducer",
    async scrape() {
        console.log(`🔥 [${this.name}] Sourcing trending content from Reddit...`);
        const content = [];
        const subreddits = ['OnlyFansGenie', 'NSFW_GIF', 'RealGirls', 'CamGirls', 'GoneWild', 'BonersInPublic', 'nsfw'];

        for (const sub of subreddits) {
            try {
                // Reddit .json trick for non-authenticated scraping
                const response = await axios.get(`https://www.reddit.com/r/${sub}/hot.json?limit=15`, {
                    headers: { 'User-Agent': 'VenuzBot/2.0' }
                });

                const children = response.data?.data?.children || [];
                for (const child of children) {
                    const post = child.data;

                    // Filter for adult content/video compatibility
                    // QUALITY CONTROL ENGINE 🛡️
                    const ups = post.ups || 0;
                    const isHighRes = post.preview?.images?.[0]?.source?.width >= 720;

                    // Filter 1: Minimum Popularity (Avoid spam/trash)
                    if (ups < 50) continue;

                    // Filter 2: Visual Quality (No pixelated content)
                    // Note: Direct video links might skip this check, handled below

                    let videoUrl = null;
                    if (post.is_video && post.media?.reddit_video?.fallback_url) {
                        videoUrl = post.media.reddit_video.fallback_url;
                    } else if (post.url && post.url.endsWith('.mp4')) {
                        videoUrl = post.url;
                    }

                    // Calculate Quality Score (0-100)
                    // Viral posts (>1000 ups) get huge boost. High Res gets boost.
                    let qualityScore = Math.min(ups / 10, 80); // Base score on likes, cap at 80
                    if (isHighRes || videoUrl) qualityScore += 20; // Bonus for HD/Video
                    if (post.all_awardings?.length > 0) qualityScore += 10; // Bonus for awards

                    content.push({
                        title: post.title.substring(0, 100),
                        description: `Comunidad r/${sub} • 🔥 ${post.ups} upvotes`,
                        image_url: post.url_overridden_by_dest || post.thumbnail,
                        video_url: videoUrl,
                        source_url: `https://reddit.com${post.permalink}`,
                        source_site: 'reddit',
                        category: 'soltero',
                        subcategory: sub,
                        location: 'Streaming / Online',
                        active: true,
                        is_verified: post.ups > 500,
                        is_premium: false,
                        quality_score: Math.round(qualityScore),
                        created_at: new Date().toISOString()
                    });
                }
            } catch (err) {
                console.error(`❌ [${this.name}] Error reaching r/${sub}:`, err.message);
            }
        }
        return content;
    }
};

module.exports = TheSeducer;
