// src/lib/venuz-hibrida/hibrida-graph.ts
import { ChatGroq } from "@langchain/groq";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tools } from "./tools";

// Prevent errors if API keys are missing during build
const GROQ_API_KEY = process.env.GROQ_API_KEY || "dummy";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "dummy";

// Groq como principal
const groqLLM = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    apiKey: GROQ_API_KEY,
});

// Gemini como fallback
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiLLM = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

// Agente con Groq
const agent = createReactAgent({
    llm: groqLLM,
    tools,
});

// Función con fallback
export async function runHibridaTour(input: string, systemPrompt?: string) {
    try {
        const messages = [];
        if (systemPrompt) {
            messages.push({ role: "system", content: systemPrompt });
        }
        messages.push({ role: "user", content: input });

        // Intenta con Groq primero
        const result = await agent.invoke({ messages });

        // Extract output
        const lastMessage = result.messages[result.messages.length - 1];
        let output = "";
        if (typeof lastMessage.content === 'string') {
            output = lastMessage.content;
        } else if (Array.isArray(lastMessage.content)) {
            output = lastMessage.content.map((c: any) => c.text || JSON.stringify(c)).join(" ");
        } else {
            output = String(lastMessage.content);
        }

        return { output };
    } catch (error) {
        console.warn("Groq falló, usando Gemini fallback", error);
        // Fallback a Gemini
        const fullPrompt = systemPrompt ? `${systemPrompt}\n\nUser: ${input}` : input;
        const result = await geminiLLM.generateContent(fullPrompt);
        return { output: result.response.text() };
    }
}
