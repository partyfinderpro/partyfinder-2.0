const BaseAPI = require('../apis/base_api');

class GooglePlacesAPI extends BaseAPI {
    constructor() {
        super();
        this.name = 'GooglePlaces';
        this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
        this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
    }

    async searchNearby(params) {
        if (!this.apiKey) {
            console.error('❌ Missing GOOGLE_PLACES_API_KEY');
            return [];
        }

        const { latitude, longitude, radius = 5000, type = 'night_club|bar' } = params;

        const searchParams = new URLSearchParams({
            location: `${latitude},${longitude}`,
            radius: radius.toString(),
            type: type,
            key: this.apiKey
        });

        const url = `${this.baseUrl}/nearbysearch/json?${searchParams.toString()}`;

        try {
            console.log(`🔍 [Google] Buscando sitos cerca de ${latitude}, ${longitude}...`);
            const data = await this.fetchWithRetry(url);

            if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
                throw new Error(`Google API Error: ${data.status} ${data.error_message || ''}`);
            }

            if (!data.results) return [];

            return data.results.map(place => this.normalize(place));

        } catch (error) {
            console.error(`❌ [Google] Error: ${error.message}`);
            return [];
        }
    }

    normalize(place) {
        let category = 'bar';
        if (place.types?.includes('night_club')) category = 'club';

        return {
            title: place.name,
            description: place.vicinity || `Sitio en ${category}`,
            image_url: place.photos?.[0]?.photo_reference
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${this.apiKey}`
                : null,
            source_url: `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${place.place_id}`,
            source_site: 'google_places',
            category: category,
            subcategory: place.types?.[0] || category,
            location: 'México', // El API no siempre da la ciudad directo en nearby
            address: place.vicinity || '',
            latitude: place.geometry?.location?.lat,
            longitude: place.geometry?.location?.lng,
            rating: place.rating,
            total_ratings: place.user_ratings_total,
            is_verified: true,
            quality_score: Math.round((place.rating || 3) * 20), // 4.5 * 20 = 90
            active: true,
            created_at: new Date().toISOString()
        };
    }
}

module.exports = GooglePlacesAPI;
