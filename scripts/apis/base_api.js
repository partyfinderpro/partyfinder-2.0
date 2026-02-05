const { RateLimiter } = require('../utils/rateLimiter');
// Note: Since this is run in node scripts context which might not handle TS imports directly if using naive execution, 
// we might need to adjust. Assuming ts-node or transpilation is handled OR we write this in JS for the scripts folder.
// Grok instruction implies TS files in scripts, but current scripts are JS. 
// I will write this as JS to match existing scraper ecosystem in /scripts.

/**
 * BaseAPI Class
 * Template for all external API integrations
 */
class BaseAPI {
    constructor() {
        if (this.constructor === BaseAPI) {
            throw new Error("Abstract classes can't be instantiated.");
        }

        // Default config
        this.rateLimitPerMinute = 60;
        this.maxRetries = 3;

        // Initialize Limiter (Mocking TS class usage in JS)
        // We'll reimplement simple limiter here if import fails or assume conversion
        this.queue = [];
        this.processing = false;
    }

    /**
     * Abstract method to be implemented by child classes
     */
    async search(params) {
        throw new Error("Method 'search()' must be implemented.");
    }

    /**
     * Fetch with Retry & Rate Limiting wrapper
     * @param {string} url 
     * @param {object} options 
     */
    async fetchWithRetry(url, options = {}) {
        return this.scheduleRequest(async () => {
            for (let i = 0; i <= this.maxRetries; i++) {
                try {
                    // dynamic import for node-fetch to support ESM/CJS mix if needed, or use global fetch in Node 18+
                    const fetchModule = await import('node-fetch');
                    const fetch = fetchModule.default || fetchModule;

                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

                    const res = await fetch(url, {
                        ...options,
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (!res.ok) {
                        // Handle 429 specifically
                        if (res.status === 429) {
                            const retryAfter = res.headers.get('Retry-After') || 5;
                            console.log(`[${this.name}] Rate limited. Waiting ${retryAfter}s...`);
                            await new Promise(r => setTimeout(r, retryAfter * 1000));
                            throw new Error(`Rate limit hit`);
                        }
                        throw new Error(`HTTP ${res.status} ${res.statusText}`);
                    }

                    return await res.json();

                } catch (e) {
                    if (i === this.maxRetries) throw e;
                    // Exponential backoff: 1s, 2s, 4s...
                    const waitTime = 1000 * Math.pow(2, i);
                    console.log(`[${this.name}] Retry ${i + 1}/${this.maxRetries} after error: ${e.message}. Waiting ${waitTime}ms`);
                    await new Promise(r => setTimeout(r, waitTime));
                }
            }
        });
    }

    /**
     * Simple Rate Limiter Logic adapted for JS class
     */
    async scheduleRequest(fn) {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try { resolve(await fn()); } catch (e) { reject(e); }
            });
            if (!this.processing) this.processQueue();
        });
    }

    async processQueue() {
        if (this.processing) return;
        this.processing = true;

        const interval = 60000 / this.rateLimitPerMinute; // ms per request

        while (this.queue.length > 0) {
            const task = this.queue.shift();
            if (task) {
                // Run task without awaiting completion to unblock timing (fire and schedule next)
                // But for APIs we often want result. The 'resolve' in scheduleRequest handles the caller.
                task();
                await new Promise(r => setTimeout(r, interval));
            }
        }

        this.processing = false;
    }
}

module.exports = BaseAPI;
