import { Tool } from "@langchain/core/tools";
import { tavily } from "@tavily/core";

export class TavilySearchResults extends Tool {
    name = "tavily_search_results_json";
    description = "A search engine optimized for comprehensive, accurate, and trusted results.";

    apiKey: string;
    maxResults: number = 5;

    constructor(fields?: { apiKey?: string; maxResults?: number }) {
        super();
        this.apiKey = fields?.apiKey || process.env.TAVILY_API_KEY!;
        if (fields?.maxResults) this.maxResults = fields.maxResults;
    }

    protected async _call(input: string): Promise<string> {
        try {
            const client = tavily({ apiKey: this.apiKey });
            // The client.search signature might vary. Assuming it accepts query string and options.
            // If query is an object, adjust accordingly.
            const response = await client.search(input, {
                maxResults: this.maxResults,
            });
            return JSON.stringify(response.results);
        } catch (error: any) {
            console.error("Tavily search error:", error);
            return "Error searching Tavily: " + error.message;
        }
    }
}
