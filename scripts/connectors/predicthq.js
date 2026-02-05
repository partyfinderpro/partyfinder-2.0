const BaseAPI = require('../apis/base_api');

class PredictHQAPI extends BaseAPI {
    constructor() {
        super();
        this.name = 'PredictHQ';
        this.token = process.env.PREDICTHQ_ACCESS_TOKEN;
        this.baseUrl = 'https://api.predicthq.com/v1';
    }

    async search(params) {
        if (!this.token) {
            console.error('❌ Missing PREDICTHQ_ACCESS_TOKEN');
            return [];
        }

        const { latitude, longitude, query, radius = '10km' } = params;

        // Endpoint: /events/
        const endpoint = `${this.baseUrl}/events/`;

        // Categorías relevantes para party/nightlife
        // concerts, performing-arts, sports, festivals, expos
        const categories = 'concerts,festivals,performing-arts,sports';

        const searchParams = new URLSearchParams({
            'category': categories,
            'location_around.origin': `${latitude},${longitude}`,
            'location_around.scale': radius.replace('km', 'km'), // PredictHQ usa formato "10km"
            'limit': '50',
            'sort': 'start'
        });

        if (query) searchParams.append('q', query);

        try {
            console.log(`🔍 [PredictHQ] Buscando eventos cerca de ${latitude}, ${longitude}...`);
            const url = `${endpoint}?${searchParams.toString()}`;

            const data = await this.fetchWithRetry(url, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/json'
                }
            });

            if (!data.results) return [];

            return data.results.map(event => this.normalize(event));

        } catch (error) {
            console.error(`❌ [PredictHQ] Error: ${error.message}`);
            return [];
        }
    }

    normalize(event) {
        // Transformar formato PredictHQ a formato VENUZ (ContentItem)
        const location = event.location || [0, 0]; // [lon, lat]

        return {
            title: event.title,
            description: event.description || `Evento categoría: ${event.category}`,
            image_url: null, // PredictHQ no siempre da imágenes directas, usaremos fallback o scraper auxiliar
            source_url: `https://www.predicthq.com/events/${event.id}`,
            affiliate_url: null,
            affiliate_source: 'predicthq',
            category: 'event',
            subcategory: event.category,
            location: event.entities?.[0]?.name || event.country || 'Ubicación confirmada',
            latitude: location[1], // lat es el segundo elemento
            longitude: location[0], // lon es el primer elemento
            is_verified: true,
            is_premium: event.rank > 60, // Si el rank es alto, es premium
            quality_score: event.rank || 50,
            active: true,
            created_at: new Date().toISOString()
        };
    }
}

module.exports = PredictHQAPI;
