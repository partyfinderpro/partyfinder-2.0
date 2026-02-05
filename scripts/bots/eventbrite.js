const axios = require('axios');
require('dotenv').config();

/**
 * THE SOCIALITE V2 (Eventbrite Bot)
 * Sourcing nightlife, parties & music events
 * API: Eventbrite Search Endpoint
 */

const EVENTBRITE_API_BASE = 'https://www.eventbriteapi.com/v3/events/search/';
const token = process.env.EVENTBRITE_API_KEY;

const cities = [
    'Puerto Vallarta, Mexico',
    'Mexico City, Mexico',
    'Guadalajara, Mexico',
    'Monterrey, Mexico'
];

const TheSocialite = {
    name: "The Socialite (Eventbrite)",

    async scrape() {
        if (!token) {
            console.warn(`⚠️ [${this.name}] EVENTBRITE_API_KEY missing. Skipping.`);
            return [];
        }

        console.log(`🥂 [${this.name}] Starting VIP search (Parties, Nightlife)...`);
        let allEvents = [];

        for (const location of cities) {
            try {
                console.log(`   Searching in: ${location}`);
                const cityEvents = await this.fetchEventsForLocation(location);
                allEvents = allEvents.concat(cityEvents);

                // Rate limit niceness
                await new Promise(r => setTimeout(r, 1000));
            } catch (err) {
                console.error(`❌ [${this.name}] Error in ${location}:`, err.message);
            }
        }

        // Sort by coming soonest
        allEvents.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

        console.log(`🥂 [${this.name}] Total Harvest: ${allEvents.length} events.`);
        return allEvents;
    },

    async fetchEventsForLocation(location) {
        const events = [];
        const now = new Date().toISOString();

        const params = {
            'location.address': location,
            'location.within': '50km',
            'start_date.range_start': now.split('.')[0], // Eventbrite format pickiness
            sort_by: 'date',
            expand: 'venue,logo',
            q: 'party OR fiesta OR concierto OR dj OR club OR nightlife OR "live music"',
            // page_size: 50 // Keep it light for now
        };

        try {
            const response = await axios.get(EVENTBRITE_API_BASE, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });

            const data = response.data;
            if (!data.events) return [];

            for (const event of data.events) {
                if (!event.venue || !event.venue.id) continue; // Skip online/nameless events

                const imageUrl = event.logo?.original?.url || event.logo?.url || null;
                const venueName = event.venue?.name || 'Unknown Venue';
                const address = event.venue.address?.localized_address_display || `${event.venue.address?.address_1}, ${event.venue.address?.city}`;

                // VENUZ Standard Object Construction
                events.push({
                    title: event.name?.text || 'Untitled Event',
                    description: (event.description?.text || event.summary || '').substring(0, 300) + '...',
                    image_url: imageUrl,
                    source_url: event.url,
                    source_site: 'Eventbrite',
                    category: 'club', // Default category for nightlife
                    type: 'event',
                    location: `${venueName}, ${event.venue.address?.city || location.split(',')[0]}`,
                    latitude: event.venue.latitude ? parseFloat(event.venue.latitude) : null,
                    longitude: event.venue.longitude ? parseFloat(event.venue.longitude) : null,
                    start_time: event.start?.local,
                    end_time: event.end?.local,
                    is_verified: true,
                    active: true,
                    tags: ['eventbrite', 'party', location.split(',')[0].toLowerCase(), event.is_free ? 'gratis' : 'paid'],
                    price_range: event.is_free ? 'Gratis' : 'Boletos'
                });
            }

        } catch (error) {
            console.error(`   ⚠️ API Error for ${location}:`, error.response?.data?.error_description || error.message);
        }

        return events;
    }
};

module.exports = TheSocialite;
