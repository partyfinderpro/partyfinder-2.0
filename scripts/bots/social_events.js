const { chromium } = require('playwright');

/**
 * THE SOCIALITE: Event Discovery Agent
 * Uses Playwright to browse heavy JS sites like Eventbrite/Facebook
 */
const TheSocialite = {
    name: "The Socialite",

    async scrape() {
        console.log(`🥂 [${this.name}] Putting on makeup and getting ready to find parties...`);
        const events = [];

        let browser;
        try {
            browser = await chromium.launch({
                headless: true
            });
            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            });
            const page = await context.newPage();

            // Target: Eventbrite Puerto Vallarta (Stable for testing Playwright)
            const targetUrl = 'https://www.eventbrite.com/d/mexico--puerto-vallarta/events--this-week/';
            console.log(`   Navigating to ${targetUrl}...`);

            await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Wait a bit for hydration
            await page.waitForTimeout(2000);

            // Select generic event cards (Selectors change often, we try broad ones)
            // Eventbrite usually has 'div.eds-event-card-content__primary-content' or similar
            // Let's try to find links that look like events

            const eventLinks = await page.locator('a[href*="/e/"]').all();
            console.log(`   Found ${eventLinks.length} potential event links.`);

            const seenUrls = new Set();

            for (const link of eventLinks) {
                if (seenUrls.size >= 5) break; // Limit to 5 for speed

                const href = await link.getAttribute('href');
                const title = await link.getAttribute('aria-label') || await link.innerText();

                if (href && title && !seenUrls.has(href)) {
                    seenUrls.add(href);
                    events.push({
                        title: title.split('\n')[0].trim(), // Take first line if multiple
                        description: 'Event found in Puerto Vallarta',
                        source_url: href.startsWith('http') ? href : `https://www.eventbrite.com${href}`,
                        source_site: 'Eventbrite',
                        type: 'event', // New type
                        category_id: 'clubes-eventos', // Maps to existing generic cat
                        active: true,
                        tags: ['event', 'party', 'puerto-vallarta', 'socialite']
                    });
                }
            }

        } catch (err) {
            console.error(`❌ [${this.name}] Failed to party:`, err.message);
        } finally {
            if (browser) await browser.close();
        }

        console.log(`✨ [${this.name}] Returning ${events.length} event(s).`);
        return events;
    }
};

module.exports = TheSocialite;
