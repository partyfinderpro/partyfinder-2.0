
import { TavilySearchResults } from "langchain/tools";
import Redis from "ioredis";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Initialize Redis with fallback to null if no URL (to prevent crash during build/dev without redis)
let redis: Redis | null = null;
if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL);
}

// Tavily Search Tool
export const tavilyTool = new TavilySearchResults({
    apiKey: process.env.TAVILY_API_KEY,
    maxResults: 5,
});

// Custom Crawler Tool (Using basic fetch/cheerio logic or just returning text for now to keep it lightweight on serverless)
// Note: For full browser scraping, we'd use Playwright, but usually that's heavy for a Vercel function tool without specialized setup.
// We'll use a simple fetch + newspaper-like extraction simulation or just fetch text.
// For now, let's implement a basic fetch.
// UPDATE: User asked for "Crawl4AI". Since that's Python, we'll use a rigorous Playwright implementation via a helper or just a text fetcher.
// Let's us Playwright as established in the project.

export const crawlPageTool = tool(
    async ({ url }) => {
        console.log(`[Crawler] Visiting ${url}...`);
        try {
            // Import playwright dynamically
            const { chromium } = await import('playwright');
            const browser = await chromium.launch({ headless: true });
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

            // Extract content
            const content = await page.evaluate(() => {
                return document.body.innerText.slice(0, 8000); // Limit context
            });

            await browser.close();
            return content;
        } catch (error: any) {
            return `Failed to crawl ${url}: ${error.message}`;
        }
    },
    {
        name: "crawl_page",
        description: "Extracts text content from a given URL to read details about events or venues.",
        schema: z.object({
            url: z.string().describe("The full URL to crawl"),
        }),
    }
);

// Cache Tools

export const cacheGetTool = tool(
    async ({ key }) => {
        if (!redis) return "Cache not available";
        const val = await redis.get(key);
        return val || "null";
    },
    {
        name: "cache_get",
        description: "Retrieves a value from the cache by key.",
        schema: z.object({ key: z.string() }),
    }
);

export const cacheSetTool = tool(
    async ({ key, value }) => {
        if (!redis) return "Cache not available";
        await redis.set(key, value, "EX", 3600); // 1h TTL
        return "OK";
    },
    {
        name: "cache_set",
        description: "Saves a value to the cache with 1 hour expiration.",
        schema: z.object({
            key: z.string(),
            value: z.string()
        }),
    }
);

export const tools = [tavilyTool, crawlPageTool, cacheGetTool, cacheSetTool];
