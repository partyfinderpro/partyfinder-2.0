const axios = require('axios');
require('dotenv').config();

/**
 * GOOGLE PLACES HUNTER
 * Uses Google Places API to fetch real venues, clubs, bars
 */

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

const GooglePlacesHunter = {
    name: "Google Places Hunter",

    async searchPlaces(query, location, radius = 50000) {
        if (!GOOGLE_API_KEY) {
            console.warn(`⚠️ [${this.name}] No GOOGLE_PLACES_API_KEY in .env`);
            return [];
        }

        console.log(`🌍 [${this.name}] Searching: "${query}" near ${location}...`);

        try {
            // Text Search API
            const url = `https://maps.googleapis.com/maps/api/place/textsearch/json`;
            const response = await axios.get(url, {
                params: {
                    query: `${query} in ${location}`,
                    key: GOOGLE_API_KEY,
                    language: 'es'
                }
            });

            if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
                console.error(`❌ [${this.name}] API Error: ${response.data.status}`);
                return [];
            }

            const places = response.data.results || [];
            console.log(`✅ [${this.name}] Found ${places.length} places for "${query}"`);

            return places.map(place => ({
                title: place.name,
                description: place.formatted_address || place.vicinity || '',
                image_url: place.photos?.[0]
                    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
                    : null,
                source_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
                location: place.formatted_address || place.vicinity,
                rating: place.rating,
                category: 'club',
                tags: [location, query, place.types?.[0]].filter(Boolean),
                latitude: place.geometry?.location?.lat,
                longitude: place.geometry?.location?.lng,
                is_verified: place.business_status === 'OPERATIONAL',
                views: place.user_ratings_total || 0,
                active: true
            }));
        } catch (err) {
            console.error(`❌ [${this.name}] Error:`, err.message);
            return [];
        }
    },

    async scrapeAll() {
        const results = [];

        // Queries by city
        const searches = [
            // Puerto Vallarta
            { query: "nightclub", location: "Puerto Vallarta, Mexico" },
            { query: "bar", location: "Puerto Vallarta, Mexico" },
            { query: "strip club", location: "Puerto Vallarta, Mexico" },
            { query: "antro", location: "Puerto Vallarta, Mexico" },
            // Guadalajara
            { query: "nightclub", location: "Guadalajara, Mexico" },
            { query: "bar lounge", location: "Guadalajara, Mexico" },
            { query: "antro", location: "Guadalajara, Mexico" },
            // CDMX
            { query: "antro", location: "Ciudad de Mexico" },
            { query: "bar", location: "Polanco, Ciudad de Mexico" },
            { query: "club nocturno", location: "Condesa, Ciudad de Mexico" },
            // Cancun
            { query: "nightclub", location: "Cancun, Mexico" },
            { query: "beach club", location: "Cancun, Mexico" },
            // Monterrey
            { query: "antro", location: "Monterrey, Mexico" },
            { query: "bar", location: "San Pedro Garza Garcia, Mexico" },
            // Tijuana
            { query: "nightclub", location: "Tijuana, Mexico" },
            { query: "bar", location: "Zona Rio, Tijuana" },
            // Playa del Carmen
            { query: "beach club", location: "Playa del Carmen, Mexico" },
            { query: "nightclub", location: "Playa del Carmen, Mexico" }
        ];

        for (const search of searches) {
            const places = await this.searchPlaces(search.query, search.location);
            results.push(...places);
            // Rate limit: Google allows ~10 requests/second
            await new Promise(r => setTimeout(r, 200));
        }

        console.log(`\n📊 [${this.name}] TOTAL: ${results.length} venues from Google Places`);
        return results;
    }
};

module.exports = GooglePlacesHunter;
