const axios = require('axios');
const cheerio = require('cheerio');

/**
 * THE WATCHER: Real-time Alerts Agent
 * Scrapes news and alerts from RSS/Public APIs
 */
const TheWatcher = {
    name: "The Watcher",
    sources: [
        { name: "Sismos Mexico (Google News)", url: "https://news.google.com/rss/search?q=sismo+mexico+when:1d&hl=es-MX&gl=MX&ceid=MX:es-419" }
    ],

    async scrape() {
        console.log(`📡 [${this.name}] Scanning for real-time alerts...`);
        const alerts = [];

        for (const source of this.sources) {
            try {
                const response = await axios.get(source.url, { timeout: 5000 });
                const $ = cheerio.load(response.data, { xmlMode: true });

                $('item').each((i, el) => {
                    if (i > 5) return; // Only latest 5
                    alerts.push({
                        title: $(el).find('title').text(),
                        description: $(el).find('description').text().replace(/<[^>]*>?/gm, ''),
                        source_url: $(el).find('link').text(),
                        source_site: source.name,
                        type: 'alert',
                        category_id: 'alertas-noticias',
                        active: true,
                        tags: ['real-time', 'alert', 'news']
                    });
                });
            } catch (err) {
                console.error(`❌ [${this.name}] Error reading ${source.name}:`, err.message);
            }
        }
        return alerts;
    }
};

module.exports = TheWatcher;
