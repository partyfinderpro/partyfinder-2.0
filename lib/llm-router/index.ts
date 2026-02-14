// src/lib/llm-router/index.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

type Provider = 'gemini' | 'groq' | 'claude' | 'grok' | 'deepseek';

interface LLMConfig {
    provider: Provider;
    apiKey: string | undefined;
    model: string;
    endpoint?: string;
    headers?: Record<string, string>;
    responsePath?: string; // ruta en JSON para extraer el texto (ej: choices[0].message.content)
}

const PROVIDERS: LLMConfig[] = [
    {
        provider: 'gemini',
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-flash-latest',
    },
    {
        provider: 'groq',
        apiKey: process.env.GROQ_API_KEY,
        model: 'llama-3.3-70b-versatile',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        responsePath: 'choices.0.message.content',
    },
    {
        provider: 'claude',
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: 'claude-3-5-sonnet-20241022',
        endpoint: 'https://api.anthropic.com/v1/messages',
        headers: { 'anthropic-version': '2023-06-01' },
        responsePath: 'content.0.text',
    },
    {
        provider: 'grok',
        apiKey: process.env.GROK_API_KEY,
        model: 'grok-beta',
        endpoint: 'https://api.x.ai/v1/chat/completions',
        responsePath: 'choices.0.message.content',
    },
    {
        provider: 'deepseek',
        apiKey: process.env.DEEPSEEK_API_KEY,
        model: 'deepseek-chat',
        endpoint: 'https://api.deepseek.com/v1/chat/completions',
        responsePath: 'choices.0.message.content',
    },
].filter(p => p.apiKey) as LLMConfig[]; // solo las que tengan key configurada

export class LLMRouter {
    private currentIndex = 0;
    private status: Record<string, { lastUsed: Date; blockedUntil?: Date; fails: number }> = {};

    constructor() {
        // Inicializar status para providers configurados
        PROVIDERS.forEach(p => {
            this.status[p.provider] = { lastUsed: new Date(0), fails: 0, blockedUntil: undefined };
        });
    }

    async generateContent(
        prompt: string,
        options: { temperature?: number; maxTokens?: number } = {}
    ): Promise<string> {
        let attempts = 0;
        const maxAttempts = PROVIDERS.length * 2; // doble intento por proveedor si es necesario

        if (PROVIDERS.length === 0) {
            throw new Error("No hay proveedores de IA configurados (falta API Keys).");
        }

        while (attempts < maxAttempts) {
            const config = PROVIDERS[this.currentIndex];
            const now = new Date();

            // Asegurar que existe el status (por si acaso)
            if (!this.status[config.provider]) {
                this.status[config.provider] = { lastUsed: new Date(0), fails: 0 };
            }
            const providerStatus = this.status[config.provider];

            // Saltar si está bloqueado
            if (providerStatus.blockedUntil && providerStatus.blockedUntil > now) {
                this.currentIndex = (this.currentIndex + 1) % PROVIDERS.length;
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
                            maxOutputTokens: options.maxTokens || 1024,
                            temperature: options.temperature || 0.7
                        }
                    });
                    response = result.response.text();
                } else {
                    // Llamada OpenAI-style para Groq, Claude, Grok, DeepSeek
                    const headers: Record<string, string> = {
                        'Content-Type': 'application/json',
                        ...(config.headers || {}),
                    };

                    if (config.provider === 'claude') {
                        headers['x-api-key'] = config.apiKey!;
                    } else {
                        headers['Authorization'] = `Bearer ${config.apiKey}`;
                    }

                    const body: any = {
                        model: config.model,
                        messages: [{ role: 'user', content: prompt }],
                        temperature: options.temperature || 0.7,
                        max_tokens: options.maxTokens || 1024,
                    };

                    const res = await fetch(config.endpoint!, {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify(body),
                    });

                    if (!res.ok) {
                        const errorText = await res.text();
                        throw new Error(`HTTP ${res.status} - ${errorText}`);
                    }

                    const data = await res.json();

                    // Extraer respuesta según proveedor
                    if (config.provider === 'claude') {
                        response = data.content?.[0]?.text || '';
                    } else {
                        response = data.choices?.[0]?.message?.content || '';
                    }
                }

                // Éxito: resetear fails y registrar uso
                providerStatus.fails = 0;
                providerStatus.lastUsed = now;
                console.log(`✅ Usando ${config.provider.toUpperCase()} (éxito)`);
                return response.trim();

            } catch (error: any) {
                console.warn(`❌ ${config.provider} falló: ${error.message}`);
                providerStatus.fails++;

                // Bloquear temporalmente si es rate limit o quota
                if (error.status === 429 || (error.message && (error.message.includes('rate limit') || error.message.includes('quota')))) {
                    const blockTime = Math.min(60000 * Math.pow(2, providerStatus.fails), 300000); // backoff exponencial, max 5 min
                    providerStatus.blockedUntil = new Date(now.getTime() + blockTime);
                }

                // Rotar al siguiente
                this.currentIndex = (this.currentIndex + 1) % PROVIDERS.length;
                attempts++;
            }
        }

        throw new Error("Todas las APIs de IA fallaron o están bloqueadas temporalmente.");
    }

    // Método para ver estado actual de proveedores
    getStatus() {
        return Object.fromEntries(
            PROVIDERS.map(p => [
                p.provider,
                {
                    lastUsed: this.status[p.provider]?.lastUsed.toISOString(),
                    blockedUntil: this.status[p.provider]?.blockedUntil?.toISOString() || null,
                    fails: this.status[p.provider]?.fails,
                },
            ])
        );
    }
}

// Instancia global (singleton)
export const llmRouter = new LLMRouter();
