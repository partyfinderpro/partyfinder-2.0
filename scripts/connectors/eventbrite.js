const BaseAPI = require('../apis/base_api');

class EventbriteAPI extends BaseAPI {
    constructor() {
        super();
        this.name = 'Eventbrite';
        this.token = process.env.EVENTBRITE_PRIVATE_TOKEN;
        this.baseUrl = 'https://www.eventbriteapi.com/v3';
    }

    async search(params) {
        if (!this.token) {
            console.error('❌ Missing EVENTBRITE_PRIVATE_TOKEN');
            return [];
        }

        const { latitude, longitude, query, radius = '10km' } = params;

        // Endpoint: /events/search/
        // Docs: https://www.eventbrite.com/platform/api#/reference/event-search
        const endpoint = `${this.baseUrl}/events/search/`;

        const searchParams = new URLSearchParams({
            'location.latitude': latitude,
            'location.longitude': longitude,
            'location.within': radius,
            'expand': 'venue,ticket_classes,category',
            'sort_by': 'date'
        });

        if (query) searchParams.append('q', query);

        try {
            console.log(`🔍 [Eventbrite] Buscando eventos cerca de ${latitude}, ${longitude}...`);
            const url = `${endpoint}?${searchParams.toString()}`;

            const data = await this.fetchWithRetry(url, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!data.events) return [];

            return data.events.map(event => this.normalize(event));

        } catch (error) {
            console.error(`❌ [Eventbrite] Error: ${error.message}`);
            return [];
        }
    }

    normalize(event) {
        // Transformar formato Eventbrite a formato VENUZ (ContentItem)
        const venue = event.venue || {};
        const logo = event.logo || {};

        return {
            title: event.name?.text || 'Evento sin título',
            description: event.description?.text || '',
            image_url: logo.original?.url || logo.url || null,
            source_url: event.url,
            affiliate_url: event.url, // Eventbrite affiliate logic could go here
            affiliate_source: 'eventbrite',
            category: 'event', // Main pillar
            subcategory: event.category?.name || 'general',
            location: venue.name || 'Ubicación por confirmar',
            latitude: venue.latitude ? parseFloat(venue.latitude) : 0,
            longitude: venue.longitude ? parseFloat(venue.longitude) : 0,
            is_verified: true,
            is_premium: false,
            active: true,
            start_time: event.start?.utc,
            end_time: event.end?.utc,
            price_currency: event.ticket_classes?.[0]?.cost?.currency,
            price_value: event.ticket_classes?.[0]?.cost?.value,
            created_at: new Date().toISOString()
        };
    }
}

module.exports = EventbriteAPI;
