
// src/lib/venuz-hibrida/tools.ts
import { tavily } from "@tavily/core";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const apiKey = process.env.TAVILY_API_KEY;

// Manual Tavily Tool Wrapping for LangChain
export const tavilyTool = tool(
    async ({ query }) => {
        if (!apiKey) return "Error: TAVILY_API_KEY not set";

        try {
            const client = tavily({ apiKey });
            const response = await client.search(query, {
                maxResults: 5,
                searchDepth: "basic" // or "advanced"
            });

            return JSON.stringify(response.results.map((r: any) => ({
                title: r.title,
                url: r.url,
                content: r.content
            })), null, 2);
        } catch (e: any) {
            return `Tavily Search Failed: ${e.message}`;
        }
    },
    {
        name: "tavily_search",
        description: "Search the web for up-to-date information about events, venues, or general queries.",
        schema: z.object({
            query: z.string().describe("The search query"),
        }),
    }
);

export const tools = [tavilyTool];
