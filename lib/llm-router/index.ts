// src/lib/llm-router/index.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

type Provider = 'gemini' | 'groq' | 'claude' | 'grok' | 'deepseek';

interface LLMConfig {
    provider: Provider;
    apiKey: string | undefined;
    model: string;
    endpoint?: string;
    headers?: Record<string, string>;
}

const PROVIDERS: LLMConfig[] = [
    { provider: 'gemini', apiKey: process.env.GEMINI_API_KEY, model: 'gemini-1.5-flash' },
    { provider: 'groq', apiKey: process.env.GROQ_API_KEY, model: 'llama-3.3-70b-versatile', endpoint: 'https://api.groq.com/openai/v1/chat/completions' },
    { provider: 'claude', apiKey: process.env.ANTHROPIC_API_KEY, model: 'claude-3-5-sonnet-20241022', endpoint: 'https://api.anthropic.com/v1/messages' },
    { provider: 'grok', apiKey: process.env.GROK_API_KEY, model: 'grok-beta', endpoint: 'https://api.x.ai/v1/chat/completions' },
    { provider: 'deepseek', apiKey: process.env.DEEPSEEK_API_KEY, model: 'deepseek-chat', endpoint: 'https://api.deepseek.com/v1/chat/completions' },
].filter(p => p.apiKey); // solo las que tengan key

export class LLMRouter {
    private currentIndex = 0;
    private status: Record<string, { lastUsed: Date; blockedUntil?: Date }> = {};

    async generateContent(prompt: string, maxTokens = 1024, temperature = 0.7): Promise<string> {
        let attempts = 0;
        const maxAttempts = PROVIDERS.length;

        if (maxAttempts === 0) {
            throw new Error("No hay proveedores de IA configurados (falta API Keys).");
        }

        while (attempts < maxAttempts) {
            const config = PROVIDERS[this.currentIndex];
            const now = new Date();

            // Verificar si está bloqueado temporalmente
            const blockUntil = this.status[config.provider]?.blockedUntil;
            if (blockUntil && blockUntil > now) {
                console.warn(`⚠️ ${config.provider} está bloqueado hasta ${blockUntil.toLocaleTimeString()}. Saltando...`);
                this.currentIndex = (this.currentIndex + 1) % maxAttempts;
                attempts++;
                continue;
            }

            try {
                let response: string = "";

                if (config.provider === 'gemini') {
                    const genAI = new GoogleGenerativeAI(config.apiKey!);
                    const model = genAI.getGenerativeModel({ model: config.model });
                    const result = await model.generateContent({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        generationConfig: {
                            maxOutputTokens: maxTokens,
                            temperature: temperature
                        }
                    });
                    response = result.response.text();
                } else if (config.provider === 'claude') {
                    const res = await fetch(config.endpoint!, {
                        method: 'POST',
                        headers: {
                            'x-api-key': config.apiKey!,
                            'anthropic-version': '2023-06-01',
                            'content-type': 'application/json',
                            ...(config.headers || {}),
                        },
                        body: JSON.stringify({
                            model: config.model,
                            messages: [{ role: 'user', content: prompt }],
                            max_tokens: maxTokens,
                            temperature: temperature,
                        }),
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
                    const data = await res.json();
                    response = data.content?.[0]?.text || '';
                } else {
                    // Llamada genérica OpenAI-style para Groq, Grok, DeepSeek
                    const res = await fetch(config.endpoint!, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${config.apiKey}`,
                            'Content-Type': 'application/json',
                            ...(config.headers || {}),
                        },
                        body: JSON.stringify({
                            model: config.model,
                            messages: [{ role: 'user', content: prompt }],
                            temperature,
                            max_tokens: maxTokens,
                        }),
                    });

                    if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);

                    const data = await res.json();
                    response = data.choices?.[0]?.message?.content || '';
                }

                // Éxito: registrar y retornar
                this.status[config.provider] = { lastUsed: now };
                console.log(`✅ Usando ${config.provider.toUpperCase()}`);
                return response;

            } catch (error: any) {
                console.warn(`❌ ${config.provider} falló: ${error.message}`);

                // Bloquear temporalmente si es rate limit
                if ((error.status === 429) || (error.message && error.message.includes('429')) || (error.message && error.message.includes('rate limit'))) {
                    const blockUntil = new Date(now.getTime() + 60000); // 1 min timeout
                    this.status[config.provider] = { lastUsed: now, blockedUntil };
                }

                // Rotar al siguiente
                this.currentIndex = (this.currentIndex + 1) % maxAttempts;
                attempts++;
            }
        }

        throw new Error("Todas las APIs de IA fallaron o están bloqueadas temporalmente.");
    }
}

// Instancia global
export const llmRouter = new LLMRouter();
