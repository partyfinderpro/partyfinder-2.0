const BaseAPI = require('../apis/base_api');

class YelpConnector extends BaseAPI {
    constructor() {
        super();
        this.name = "Yelp";
        // Yelp Rate Limit is tight, be careful
        this.rateLimitPerMinute = 20;
    }

    async search(params) {
        // Params: lat, lon, radius, categories, limit
        const apiKey = process.env.YELP_API_KEY;
        if (!apiKey) {
            console.warn('[Yelp] No API Key found.');
            return [];
        }

        const url = `https://api.yelp.com/v3/businesses/search?latitude=${params.lat}&longitude=${params.lon}&radius=${Math.min(40000, params.radius)}&categories=${params.categories}&limit=50&sort_by=rating`;

        try {
            const data = await this.fetchWithRetry(url, {
                headers: { Authorization: `Bearer ${apiKey}` }
            });
            return (data.businesses || []).map(b => this.normalize(b));
        } catch (error) {
            console.error(`[Yelp] Search failed: ${error.message}`);
            return [];
        }
    }

    normalize(item) {
        return {
            title: item.name,
            description: `Rated ${item.rating}/5 with ${item.review_count} reviews. ${item.categories?.map(c => c.title).join(', ')}`,
            image_url: item.image_url,
            source_url: item.url,
            source_site: 'Yelp',
            latitude: item.coordinates?.latitude,
            longitude: item.coordinates?.longitude,
            category: 'club', // Default mapping
            rating: item.rating,
            reviews: item.review_count,
            price: item.price,
            active: true,
            address: item.location?.display_address?.join(', '),
            phone: item.phone,
            is_permanent: true // Yelp venues are usually permanent businesses
        };
    }
}

module.exports = YelpConnector;
