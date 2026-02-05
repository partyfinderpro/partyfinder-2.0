/**
 * BaseBot Class
 * Parent class for all specialized scrapers (hijos)
 */
class BaseBot {
    constructor(name, categoryId) {
        this.name = name;
        this.categoryId = categoryId; // 'clubes-eventos', 'cultura', etc.
    }

    /**
     * Main execution method
     * @param {object} context - { lat, lon, radius, ... }
     */
    async scrape(context) {
        console.log(`🤖 [${this.name}] Starting scrape sequence...`);
        try {
            const rawData = await this.fetchData(context);
            if (!rawData || rawData.length === 0) {
                console.log(`   [${this.name}] No raw data found.`);
                return [];
            }

            const normalized = rawData.map(item => this.normalize(item)).filter(i => i !== null);
            console.log(`   ✅ [${this.name}] Yielded ${normalized.length} items.`);
            return normalized;
        } catch (error) {
            console.error(`❌ [${this.name}] Critical Failure:`, error);
            return [];
        }
    }

    /**
     * ABSTRACT: Fetch data from source
     */
    async fetchData(context) {
        throw new Error(`${this.name} must implement fetchData()`);
    }

    /**
     * ABSTRACT: Normalize data to VENUZ schema
     */
    normalize(item) {
        // Return object conforming to DB Schema
        // { title, description, source_url, ... }
        throw new Error(`${this.name} must implement normalize()`);
    }
}

module.exports = BaseBot;
