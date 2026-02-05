const BaseAPI = require('../apis/base_api');

class BandsintownAPI extends BaseAPI {
    constructor() {
        super();
        this.name = 'Bandsintown';
        this.appId = process.env.BANDSINTOWN_APP_ID || 'venuz_app';
        this.baseUrl = 'https://rest.bandsintown.com';
    }

    async searchByArtist(artistName) {
        if (!artistName) return [];

        const endpoint = `${this.baseUrl}/artists/${encodeURIComponent(artistName)}/events`;
        const url = `${endpoint}?app_id=${this.appId}`;

        try {
            console.log(`🔍 [Bandsintown] Buscando eventos para: ${artistName}...`);
            const data = await this.fetchWithRetry(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json'
                }
            });

            if (!Array.isArray(data)) {
                console.warn(`⚠️ [Bandsintown] Respuesta no es un array para ${artistName}:`, data);
                return [];
            }

            // Filtrar solo eventos en México para mantener la relevancia local
            const mxEvents = data.filter(event =>
                event.venue?.country === 'Mexico' ||
                event.venue?.country === 'MX'
            );

            return mxEvents.map(event => this.normalize(event, artistName));

        } catch (error) {
            console.error(`❌ [Bandsintown] Error fetching ${artistName}: ${error.message}`);
            return [];
        }
    }

    normalize(event, artistName) {
        // Transformar formato Bandsintown a formato VENUZ (ContentItem)
        return {
            title: `${artistName} @ ${event.venue?.name || 'Concierto'}`,
            description: event.description || `Concierto de ${artistName} en ${event.venue?.city || 'México'}.`,
            image_url: event.thumbnail_url || null, // Bandsintown a veces da el thumb del artista
            source_url: event.url,
            source_site: 'bandsintown',
            affiliate_url: event.url, // Usamos la URL de tickets como link de "afiliado" inicial
            affiliate_source: 'bandsintown',
            category: 'event',
            subcategory: 'concierto',
            location: `${event.venue?.city || 'México'}, ${event.venue?.region || ''}`,
            venue_name: event.venue?.name,
            address: event.venue?.location || '',
            latitude: parseFloat(event.venue?.latitude) || null,
            longitude: parseFloat(event.venue?.longitude) || null,
            is_verified: true,
            is_premium: true, // Conciertos de artistas conocidos suelen ser premium content
            quality_score: 85,
            active: true,
            created_at: new Date().toISOString()
        };
    }
}

module.exports = BandsintownAPI;
