
// src/lib/llm-router/index.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

type Provider = 'gemini' | 'claude' | 'groq' | 'grok' | 'deepseek';

interface LLMConfig {
    provider: Provider;
    apiKey: string;
    model: string;
}

// Configuración de proveedores disponibles (solo los que tengan API KEY definida)
const PROVIDERS: LLMConfig[] = [
    // Prioridad 1: Gemini (Rápido, Gratuito/Barato)
    process.env.GEMINI_API_KEY ? { provider: 'gemini', apiKey: process.env.GEMINI_API_KEY, model: 'gemini-1.5-flash' } : null,
    // Prioridad 2: Groq (Ultra rápido para inferencia)
    process.env.GROQ_API_KEY ? { provider: 'groq', apiKey: process.env.GROQ_API_KEY, model: 'llama-3.3-70b-versatile' } : null,
    // Prioridad 3: DeepSeek (Calidad/Precio excelente)
    process.env.DEEPSEEK_API_KEY ? { provider: 'deepseek', apiKey: process.env.DEEPSEEK_API_KEY, model: 'deepseek-chat' } : null,
    // Prioridad 4: Claude (Calidad Premium) - Fallback potente
    process.env.ANTHROPIC_API_KEY ? { provider: 'claude', apiKey: process.env.ANTHROPIC_API_KEY, model: 'claude-3-5-sonnet-20241022' } : null,
    // Prioridad 5: xAI Grok (Conocimiento en tiempo real)
    process.env.GROK_API_KEY ? { provider: 'grok', apiKey: process.env.GROK_API_KEY, model: 'grok-2-1212' } : null,
].filter(Boolean) as LLMConfig[];

export class LLMRouter {
    private currentIndex = 0;

    async generateContent(prompt: string, options: { temperature?: number; maxTokens?: number } = {}): Promise<string> {
        if (PROVIDERS.length === 0) {
            throw new Error("No hay proveedores de IA configurados (falta API Keys).");
        }

        let attempts = 0;
        const maxAttempts = PROVIDERS.length;

        // Intentar con el proveedor actual y rotar si falla
        while (attempts < maxAttempts) {
            const config = PROVIDERS[this.currentIndex];

            try {
                console.log(`[LLM Router] 🤖 Intentando con ${config.provider.toUpperCase()} (${config.model})...`);

                let responseText = "";

                if (config.provider === 'gemini') {
                    const genAI = new GoogleGenerativeAI(config.apiKey);
                    const model = genAI.getGenerativeModel({ model: config.model });
                    const result = await model.generateContent(prompt);
                    responseText = result.response.text();
                }
                else if (config.provider === 'groq') {
                    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${config.apiKey}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            model: config.model,
                            messages: [{ role: 'user', content: prompt }],
                            temperature: options.temperature ?? 0.7,
                            max_tokens: options.maxTokens,
                        }),
                    });

                    if (!res.ok) throw new Error(`Groq API Error: ${res.statusText}`);
                    const data = await res.json();
                    responseText = data.choices?.[0]?.message?.content || "";
                }
                else if (config.provider === 'deepseek') {
                    // DeepSeek es compatible con OpenAI API format
                    const res = await fetch('https://api.deepseek.com/v1/chat/completions', { // Endpoint genérico, verificar docs
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${config.apiKey}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            model: config.model,
                            messages: [{ role: 'user', content: prompt }],
                            temperature: options.temperature ?? 0.7,
                        }),
                    });
                    if (!res.ok) throw new Error(`DeepSeek API Error: ${res.statusText}`);
                    const data = await res.json();
                    responseText = data.choices?.[0]?.message?.content || "";
                }
                else if (config.provider === 'claude') {
                    // Implementación básica fetch para Anthropic
                    const res = await fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST',
                        headers: {
                            'x-api-key': config.apiKey,
                            'anthropic-version': '2023-06-01',
                            'content-type': 'application/json',
                        },
                        body: JSON.stringify({
                            model: config.model,
                            max_tokens: options.maxTokens || 1024,
                            messages: [{ role: 'user', content: prompt }],
                            temperature: options.temperature ?? 0.7,
                        }),
                    });
                    if (!res.ok) throw new Error(`Claude API Error: ${res.statusText}`);
                    const data = await res.json();
                    responseText = data.content?.[0]?.text || "";
                }
                // ... Agregar otros providers aquí

                if (!responseText) throw new Error("Respuesta vacía del proveedor.");

                console.log(`[LLM Router] ✅ Éxito con ${config.provider.toUpperCase()}`);
                return responseText;

            } catch (error: any) {
                console.warn(`[LLM Router] ❌ Error con ${config.provider}: ${error.message}`);

                // Rotar al siguiente proveedor para el próximo intento inmediato
                this.currentIndex = (this.currentIndex + 1) % PROVIDERS.length;
                attempts++;

                // Si fue un error de rate limit (429), esperar un poco antes de reintentar con el siguiente
                if (error?.status === 429 || error?.message?.includes('429')) {
                    console.warn(`[LLM Router] ⏳ Rate limit detectado. Esperando 2s antes de fallback...`);
                    await new Promise(r => setTimeout(r, 2000));
                }
            }
        }

        throw new Error("FATAL: Todos los proveedores de IA fallaron. No hay cerebro disponible.");
    }
}

// Exportar instancia única (Singleton)
export const llmRouter = new LLMRouter();
