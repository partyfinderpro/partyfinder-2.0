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
        const subreddits = ['OnlyFansGenie', 'NSFW_GIF', 'RealGirls', 'CamGirls'];

        for (const sub of subreddits) {
            try {
                // Reddit .json trick for non-authenticated scraping
                const response = await axios.get(`https://www.reddit.com/r/${sub}/hot.json?limit=15`, {
                    headers: { 'User-Agent': 'VenuzBot/2.0' }
                });

                const children = response.data?.data?.children || [];
                children.forEach(child => {
                    const post = child.data;

                    // Filter for adult content/video compatibility
                    if (post.over_18) {
                        let videoUrl = null;
                        let affiliateUrl = null;

                        // Video extraction logic
                        if (post.is_video && post.media?.reddit_video?.fallback_url) {
                            videoUrl = post.media.reddit_video.fallback_url;
                        } else if (post.url && (post.url.endsWith('.mp4') || post.url.includes('redgifs') || post.url.includes('imgur'))) {
                            // Simple heuristic for external video links
                            // Note: deep redgifs support needs specific handling, for now we treat direct MP4s
                            if (post.url.endsWith('.mp4')) videoUrl = post.url;
                        }

                        // Heuristic detection for affiliate content in title
                        // (Very basic, would need cleaner parsing in production)
                        if (post.title.toLowerCase().includes('cam') || sub === 'CamGirls') {
                            // Mock affiliate for purposes of V2 demo if none found
                            // In real prod, we'd parse comments or specific domains
                            // affiliateUrl = "https://camsoda.com/track/..." 
                        }

                        content.push({
                            title: post.title,
                            description: `De r/${sub} • ${post.ups} likes`,
                            image_url: post.url_overridden_by_dest || post.thumbnail,
                            thumbnail_url: post.thumbnail && post.thumbnail.startsWith('http') ? post.thumbnail : null,
                            video_url: videoUrl,
                            source_url: `https://reddit.com${post.permalink}`,
                            source_site: `Reddit r/${sub}`,
                            type: 'social',
                            category_id: 'contenido-xxx',
                            active: true,
                            tags: ['reddit', 'trending', sub, videoUrl ? 'video' : 'image'],

                            // New V2 Fields
                            affiliate_url: affiliateUrl,
                            affiliate_source: affiliateUrl ? 'other' : null,
                            is_premium: false
                        });
                    }
                });
            } catch (err) {
                console.error(`❌ [${this.name}] Error reaching r/${sub}:`, err.message);
            }
        }
        return content;
    }
};

module.exports = TheSeducer;
