import { TavilySearchResults } from "./tavily-tool";

// Export instantiated tools array for agent usage
export const tools = [
    new TavilySearchResults({
        apiKey: process.env.TAVILY_API_KEY!,
        maxResults: 5,
    }),
];
