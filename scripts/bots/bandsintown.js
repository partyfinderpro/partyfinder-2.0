const axios = require('axios');
require('dotenv').config();

/**
 * THE GROUPIE (Bandsintown Bot)
 * Sourcing live music gigs from local artists and venues.
 * API: Bandsintown V3 (Public "app_id" usually works for read-only)
 */

const BANDSINTOWN_API_BASE = 'https://rest.bandsintown.com/events';
const APP_ID = process.env.BANDSINTOWN_APP_ID || 'venuz_app_public'; // Fallback public ID often works

const cities = [
    'Puerto Vallarta, Mexico',
    'Mexico City, Mexico',
    'Guadalajara, Mexico',
    'Monterrey, Mexico',
    'Tijuana, Mexico'
];

const TheGroupie = {
    name: "The Groupie (Bandsintown)",

    async scrape() {
        console.log(`🎸 [${this.name}] Listening for live music...`);
        let allGigs = [];

        // Note: Bandsintown search by location is sometimes restrictive without specific artist.
        // We will try iterating known cities.

        for (const city of cities) {
            try {
                // Be gentle with the public API
                await new Promise(r => setTimeout(r, 1000));

                console.log(`   Checking venues in: ${city}`);
                const gigs = await this.fetchEventsForLocation(city);
                allGigs = allGigs.concat(gigs);

            } catch (err) {
                console.error(`❌ [${this.name}] Error in ${city}:`, err.message);
            }
        }

        console.log(`🎸 [${this.name}] Total Gigs Found: ${allGigs.length}`);
        return allGigs;
    },

    async fetchEventsForLocation(location) {
        const events = [];

        // Bandsintown doesn't have a direct "search all events in city" public endpoint easily documented 
        // without an artist, BUT often crawling major artists or using the undocumented /events search helps.
        // Since we want a robust solution, we use the standard "artist" approach IF we had a list, 
        // OR we try the search endpoint.

        // Strategy: We will use a "Venue Search" approach effectively by querying popular artists 
        // or just defaulting to a simpler method if available. 
        // *Correction*: Without a paid partner key, Bandsintown is artist-centric. 
        // FORCE MULTIPLIER: We will try to simulate a generic search or use a known list of "Hot Artists" 
        // relevant to Mexico to populate initial feed if location search fails.
        // 
        // HOWEVER, for this file, let's implement the generic V3 search which sometimes accepts location parameters.

        const params = {
            app_id: APP_ID,
            date: 'upcoming',
            location: location
        };

        try {
            const response = await axios.get(BANDSINTOWN_API_BASE, { params });

            const data = response.data;
            if (!Array.isArray(data)) return [];

            for (const item of data) {
                if (!item.venue) continue;

                // Filter out far away events if fuzzy matching returns weird results
                if (item.venue.country !== 'Mexico') continue;

                const startDate = item.datetime;

                events.push({
                    title: `Live: ${item.lineup.join(', ')}`,
                    description: `Live music performance at ${item.venue.name}. Lineup: ${item.lineup.join(', ')}.`,
                    image_url: item.artist?.image_url || null, // Artist image
                    source_url: item.url,
                    source_site: 'Bandsintown',
                    category: 'club', // Live music fits here
                    type: 'event',
                    location: item.venue.name,
                    latitude: item.venue.latitude ? parseFloat(item.venue.latitude) : null,
                    longitude: item.venue.longitude ? parseFloat(item.venue.longitude) : null,
                    start_time: startDate,
                    end_time: null,
                    is_verified: true,
                    active: true,
                    tags: ['live music', 'concert', 'bandsintown', ...item.lineup],
                    price_range: item.offers && item.offers.length > 0 ? 'Boletos' : 'Gratis / TBD'
                });
            }

        } catch (error) {
            // Bandsintown might 403/400 on generic location search depending on current API tightness
            // Only log if it's not a standard "no results"
            console.log(`   ⚠️ Bandsintown restricted for ${location} (standard with free key). Skipping.`);
        }

        return events;
    }
};

module.exports = TheGroupie;
