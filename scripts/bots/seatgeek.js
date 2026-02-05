const axios = require('axios');
require('dotenv').config();

/**
 * THE SCOUTER (SeatGeek Bot)
 * Sourcing concerts, sports, and theater events.
 * API: SeatGeek Platform (Free tier available)
 */

const SEATGEEK_API_BASE = 'https://api.seatgeek.com/2/events';
const CLIENT_ID = process.env.SEATGEEK_CLIENT_ID;

// Cities hardcoded for VENUZ context (can be dynamic later)
const cities = [
    { name: 'Mexico City', lat: 19.4326, lon: -99.1332 },
    { name: 'Guadalajara', lat: 20.6597, lon: -103.3496 },
    { name: 'Monterrey', lat: 25.6866, lon: -100.3161 },
    { name: 'Puerto Vallarta', lat: 20.6534, lon: -105.2253 },
    { name: 'Cancun', lat: 21.1619, lon: -86.8515 }
];

const TheScouter = {
    name: "The Scouter (SeatGeek)",

    async scrape() {
        if (!CLIENT_ID) {
            console.warn(`⚠️ [${this.name}] SEATGEEK_CLIENT_ID missing. Skipping.`);
            return [];
        }

        console.log(`🏟️ [${this.name}] Scanning stadium & theater grid...`);
        let allEvents = [];

        for (const city of cities) {
            try {
                // Rate limit niceness (SeatGeek is generous but let's be polite)
                await new Promise(r => setTimeout(r, 500));

                console.log(`   Scanning sector: ${city.name}`);
                const cityEvents = await this.fetchEventsForCity(city);
                allEvents = allEvents.concat(cityEvents);

            } catch (err) {
                console.error(`❌ [${this.name}] Error in ${city.name}:`, err.message);
            }
        }

        console.log(`🏟️ [${this.name}] Total Intel: ${allEvents.length} events secured.`);
        return allEvents;
    },

    async fetchEventsForCity(city) {
        const events = [];

        const params = {
            client_id: CLIENT_ID,
            lat: city.lat,
            lon: city.lon,
            range: '50km',
            per_page: 25, // Getting top 25 big events per city
            sort: 'score.desc', // Most popular first
            'datetime_utc.gt': new Date().toISOString()
        };

        try {
            const response = await axios.get(SEATGEEK_API_BASE, { params });

            const data = response.data;
            if (!data.events) return [];

            for (const item of data.events) {
                if (!item.venue) continue;

                // Image handling: SeatGeek doesn't always give event images, use performer image if available
                let imageUrl = null;
                if (item.performers && item.performers.length > 0) {
                    imageUrl = item.performers[0].image;
                }

                const venueName = item.venue.name || 'Unknown Venue';
                const address = `${item.venue.address || ''}, ${item.venue.city || city.name}`;

                // Formatear categoría basada en taxonomía de SeatGeek
                let category = 'club'; // Default fallback
                if (item.type === 'concert') category = 'club'; // O 'musica' si tuvieramos
                if (item.type.includes('sport')) category = 'club'; // Eventos sociales/deportivos caen en el feed general por ahora

                events.push({
                    title: item.title,
                    description: `Event type: ${item.type}. ` + (item.description || ''),
                    image_url: imageUrl,
                    source_url: item.url,
                    source_site: 'SeatGeek',
                    category: category,
                    type: 'event',
                    location: venueName,
                    latitude: item.venue.location ? item.venue.location.lat : city.lat,
                    longitude: item.venue.location ? item.venue.location.lon : city.lon,
                    start_time: item.datetime_local,
                    end_time: null, // SeatGeek rarely gives end time
                    is_verified: true,
                    active: true,
                    tags: ['seatgeek', item.type, 'popular'],
                    price_range: item.stats?.average_price ? `$${item.stats.average_price}` : 'Boletos'
                });
            }

        } catch (error) {
            console.error(`   ⚠️ API Error for ${city.name}:`, error.response?.data || error.message);
        }

        return events;
    }
};

module.exports = TheScouter;
