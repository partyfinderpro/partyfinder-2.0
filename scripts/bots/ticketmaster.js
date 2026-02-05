const axios = require('axios');
require('dotenv').config();

/**
 * THE PROMOTER (Ticketmaster Bot)
 * Sourcing verified events: Concerts, Sports, Festivals
 * API: Ticketmaster Discovery API v2
 */

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;

const TARGET_CITIES = [
    { name: 'Puerto Vallarta', stateCode: 'JAL', geoPoint: '9g70' }, // Geohash approximation or just city search
    { name: 'Guadalajara', stateCode: 'JAL', geoPoint: '9ewt' },
    { name: 'Mexico City', stateCode: 'DF', geoPoint: '9g3w' },
    { name: 'Monterrey', stateCode: 'NL', geoPoint: '9u8d' },
    { name: 'Cancun', stateCode: 'ROO', geoPoint: 'd5j2' }
];

const ThePromoter = {
    name: "The Promoter (Ticketmaster)",

    async scrape() {
        if (!TICKETMASTER_API_KEY) {
            console.warn(`⚠️ [${this.name}] No TICKETMASTER_API_KEY found. Skipping.`);
            return [];
        }

        console.log(`🎫 [${this.name}] Checking lineups for major events...`);
        let allEvents = [];

        for (const city of TARGET_CITIES) {
            try {
                // Fetch Music, Sports, Arts, Nightlife
                const url = `https://app.ticketmaster.com/discovery/v2/events.json`;
                const response = await axios.get(url, {
                    params: {
                        apikey: TICKETMASTER_API_KEY,
                        city: city.name,
                        countryCode: 'MX',
                        sort: 'date,asc',
                        size: 20, // Top 20 upcoming
                        classificationName: ['music', 'sports', 'nightlife', 'festivals']
                    }
                });

                if (!response.data._embedded || !response.data._embedded.events) {
                    console.log(`   [${city.name}] No upcoming events found via API.`);
                    continue;
                }

                const events = response.data._embedded.events;
                console.log(`   ✅ [${city.name}] Found ${events.length} events.`);

                const formattedEvents = events.map(e => this.formatEvent(e, city.name));
                allEvents = [...allEvents, ...formattedEvents];

                // Respect rate limits (5 per second is the limit usually, but be safe)
                await new Promise(r => setTimeout(r, 500));

            } catch (error) {
                console.error(`❌ [${this.name}] Error fetching ${city.name}:`, error.message);
            }
        }

        console.log(`🎫 [${this.name}] Total Harvest: ${allEvents.length} events ready.`);
        return allEvents;
    },

    formatEvent(event, cityName) {
        // High res image finder
        const image = event.images.reduce((prev, current) => {
            return (prev.width > current.width) ? prev : current;
        })?.url;

        // Venue handling
        const venue = event._embedded?.venues?.[0];
        const locationStr = venue ? `${venue.name}, ${cityName}` : cityName;

        return {
            title: event.name,
            description: `Event at ${venue?.name || cityName}. ${event.info || 'Tickets available now.'}`,
            image_url: image,
            source_url: event.url, // Ticketmaster purchase link
            source_site: 'Ticketmaster',
            category: this.mapCategory(event.classifications),
            type: 'event',
            start_time: event.dates?.start?.dateTime,
            end_time: null, // Ticketmaster often doesn't give end time easily in list view
            location: locationStr,
            latitude: venue?.location?.latitude ? parseFloat(venue.location.latitude) : null,
            longitude: venue?.location?.longitude ? parseFloat(venue.location.longitude) : null,
            price_range: event.priceRanges ? `${event.priceRanges[0].min}-${event.priceRanges[0].max} ${event.priceRanges[0].currency}` : 'Consultar',
            tags: ['ticketmaster', 'verified', cityName, event.classifications?.[0]?.segment?.name?.toLowerCase()].filter(Boolean),
            is_verified: true,
            active: true
        };
    },

    mapCategory(classifications) {
        if (!classifications) return 'evento';
        const segment = classifications[0]?.segment?.name?.toLowerCase();

        if (segment === 'music') return 'concierto';
        if (segment === 'sports') return 'deportes';
        if (segment === 'arts' || segment === 'theatre') return 'cultura';
        return 'evento';
    }
};

module.exports = ThePromoter;
