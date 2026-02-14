// src/lib/venuz-hibrida/hibrida-graph.ts
import { ChatGroq } from "@langchain/groq";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { pull } from "langchain/hub";

// Check if GROQ_API_KEY is available, or use a dummy for build time if needed
const apiKey = process.env.GROQ_API_KEY || "gsk_dummy";

const llm = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    apiKey: apiKey,
});

// Prompt base para agente nacional
// We need to fetch the prompt. In a real env, pull() fetches from LangSmith Hub.
// If this fails (no API key for Hub), we might need a local fallback prompt.
// For now, adhering to instructions.
let agent: any;

export async function initializeAgent() {
    if (agent) return agent;

    try {
        const prompt = await pull("hwchase17/react");
        agent = createReactAgent({
            llm,
            tools: [], // agregaremos tools después (navegación, extracción, cache)
            prompt: prompt as any,
        });
    } catch (e) {
        console.error("Failed to pull prompt from LangChain Hub, using local fallback if needed.", e);
        // Fallback or re-throw
        throw e;
    }
    return agent;
}

export async function runHibridaTour(city: string) {
    try {
        const agentInstance = await initializeAgent();
        const input = {
            messages: [{ role: "user", content: `Descubre nightlife en ${city} hoy: eventos, clubs, bares, contenido adulto. Usa fuentes reales, clasifica y entrega JSON limpio.` }]
        };

        const result = await agentInstance.invoke(input);
        // The result format depends on the agent type. Prebuilt React agent usually returns the last message or state.
        // We'll assume the output is in the last message content for now.
        const output = result.messages ? result.messages[result.messages.length - 1].content : "No output";
        return output;
    } catch (e) {
        console.error("Error running Hibrida Tour:", e);
        return { error: "Failed to run agent", details: e };
    }
}
