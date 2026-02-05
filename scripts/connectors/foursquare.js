const BaseAPI = require('../apis/base_api');

class FoursquareAPI extends BaseAPI {
    constructor() {
        super();
        this.name = 'Foursquare';
        this.apiKey = process.env.FOURSQUARE_API_KEY;
        this.baseUrl = 'https://api.foursquare.com/v3';
    }

    async searchPlaces(params) {
        if (!this.apiKey) {
            console.error('❌ Missing FOURSQUARE_API_KEY');
            return [];
        }

        const { latitude, longitude, query, categories = '10032,10000,13003' } = params; // Nightlife, Entertainment, Bar

        const searchParams = new URLSearchParams({
            ll: `${latitude},${longitude}`,
            categories: categories,
            sort: 'DISTANCE',
            limit: '50'
        });

        if (query) searchParams.append('query', query);

        const url = `${this.baseUrl}/places/search?${searchParams.toString()}`;

        try {
            console.log(`🔍 [Foursquare] Buscando sitios cerca de ${latitude}, ${longitude}...`);
            const data = await this.fetchWithRetry(url, {
                headers: {
                    'Authorization': this.apiKey,
                    'Accept': 'application/json'
                }
            });

            if (!data.results) return [];

            return data.results.map(place => this.normalize(place));

        } catch (error) {
            console.error(`❌ [Foursquare] Error: ${error.message}`);
            return [];
        }
    }

    normalize(place) {
        // Mapeo simple de categorías de Foursquare a categorías de VENUZ
        let category = 'bar';
        if (place.categories?.some(c => c.name.toLowerCase().includes('club'))) category = 'club';
        if (place.categories?.some(c => c.name.toLowerCase().includes('disco'))) category = 'club';

        return {
            title: place.name,
            description: place.location?.formatted_address || `Sitio en ${place.location?.city || 'México'}`,
            image_url: null, // Foursquare requiere otro llamado para fotos, usaremos fallback
            source_url: `https://foursquare.com/v/${place.fsq_id}`,
            source_site: 'foursquare',
            category: category,
            subcategory: place.categories?.[0]?.name || category,
            location: place.location?.city || 'México',
            address: place.location?.address || '',
            latitude: place.geocodes?.main?.latitude,
            longitude: place.geocodes?.main?.longitude,
            is_verified: true,
            quality_score: 70,
            active: true,
            created_at: new Date().toISOString()
        };
    }
}

module.exports = FoursquareAPI;
