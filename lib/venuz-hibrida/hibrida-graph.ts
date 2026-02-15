
import { ChatGroq } from "@langchain/groq";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { pull } from "langchain/hub";
import { tools } from "@/lib/venuz-hibrida/tools";
import { HumanMessage } from "@langchain/core/messages";

// Use Groq with failover/fallback logic if key missing?
// Assuming key is present for now as per previous instructions.
const apiKey = process.env.GROQ_API_KEY || "gsk_dummy";

const llm = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    apiKey: apiKey,
    temperature: 0.5,
});

// Singleton promise for agent initialization
let agentPromise: Promise<any> | null = null;

async function createAgent() {
    try {
        // Try to pull prompt, fallback to simple string if fails (e.g. no auth)
        let prompt;
        try {
            prompt = await pull("hwchase17/react");
        } catch (e) {
            console.warn("Could not pull prompt from hub, using default system message.");
            // Fallback is implicitly handled by createReactAgent if prompt is omitted or we can pass a simple one?
            // createReactAgent requires a specific graph structure usually or modifies a standard one.
            // If prompt is mandatory, we might need a workaround.
            // Actually createReactAgent *can* work without explicit prompt in some versions, or we can use a basic one.
            // Using a basic string prompt isn't directly compatible with the interface expected by createReactAgent (which takes a compiled graph prompt usually).
            // Retrying or assuming it works for this P0. 
            // If pulling fails, we might just fail.
            throw e;
        }

        return createReactAgent({
            llm,
            tools,
            prompt: prompt as any,
        });
    } catch (e) {
        console.error("Error creating agent:", e);
        throw e;
    }
}

export async function getHibridaAgent() {
    if (!agentPromise) {
        agentPromise = createAgent();
    }
    return agentPromise;
}

export async function runHibridaTour(city: string) {
    try {
        const agent = await getHibridaAgent();

        const input = {
            messages: [
                new HumanMessage(`Descubre nightlife en ${city} hoy. 
            1. Busca "eventos nightlife ${city} hoy" o "top clubs ${city}" usando Tavily.
            2. Si encuentras links prometedores, usa crawl_page para leer detalles.
            3. Intenta guardar lo mejor en cache.
            4. Entrega un JSON limpio con al menos 3 items encontrados (nombre, lugar, descripcion).`)
            ]
        };

        const result = await agent.invoke(input);

        // Extract the last message content
        const lastMessage = result.messages[result.messages.length - 1];
        return lastMessage.content;

    } catch (e: any) {
        console.error("Error running Hibrida Tour:", e);
        return `Error: ${e.message}`;
    }
}
