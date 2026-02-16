// lib/agent/router.ts

import { Groq } from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Anthropic } from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';

interface RoutingDecision {
    provider: 'groq' | 'gemini' | 'claude' | 'openrouter' | 'local';
    model: string;
    reason: string;
    latencyEstimate?: number;
}

// Lazy load clients to ensure env vars are ready
const getGroq = () => {
    if (process.env.GROQ_API_KEY) return new Groq({ apiKey: process.env.GROQ_API_KEY });
    return null;
};

const getGenAI = () => {
    if (process.env.GEMINI_API_KEY) return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    return null;
};

const getAnthropic = () => {
    if (process.env.ANTHROPIC_API_KEY) return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return null;
};

export async function smartRouter(
    prompt: string,
    context?: { taskType?: string; requiresReasoning?: boolean; image?: boolean; length?: 'short' | 'medium' | 'long' }
): Promise<RoutingDecision> {
    // 1. Reglas rápidas (hard rules) - siempre primero
    if (prompt.length < 100 && !context?.requiresReasoning && !context?.image) {
        return {
            provider: 'groq',
            model: 'llama3-8b-8192',
            reason: 'Prompt corto y simple → Groq es el más rápido y barato'
        };
    }

    if (context?.image) {
        if (getGenAI()) {
            return {
                provider: 'gemini',
                model: 'gemini-1.5-flash',
                reason: 'Requiere visión → solo Gemini y Claude la tienen, Gemini más barato'
            };
        } else {
            return {
                provider: 'groq', // Fallback if no Gemini, though Groq can't do image
                model: 'llama3-70b-8192',
                reason: 'Fallback: Image requested but Gemini key missing. Using Groq text model.'
            }
        }
    }

    if (context?.requiresReasoning && (prompt.includes('code') || prompt.includes('debug'))) {
        if (getAnthropic()) {
            return {
                provider: 'claude',
                model: 'claude-3-haiku-20240307',
                reason: 'Tarea de código/debug → Claude es superior en razonamiento estructurado'
            };
        }
    }

    // 2. Decisión dinámica con mini-LLM (usamos Groq ultra-rápido para decidir)
    try {
        const groqClient = getGroq();
        if (!groqClient) throw new Error("Groq API key missing");

        const decisionPrompt = `
Eres un router experto de LLMs. Decide el mejor modelo para este prompt.
Opciones disponibles:
- groq/llama3-70b (excelente razonamiento, caro)
- groq/llama3-8b (rápido y barato)
- gemini/gemini-1.5-pro (buen razonamiento, multimodal)
- claude/claude-3-opus (mejor razonamiento, más caro)
- openrouter (fallback)

Prompt del usuario: "${prompt.substring(0, 1000)}..."

Responde SOLO en JSON: {"provider": "...", "model": "...", "reason": "..."}
`;

        const completion = await groqClient.chat.completions.create({
            messages: [{ role: 'user', content: decisionPrompt }],
            model: 'llama3-8b-8192',
            temperature: 0,
            max_tokens: 150
        });

        const raw = completion.choices[0]?.message?.content || '';
        // Intentar extraer JSON si hay texto alrededor
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : raw;

        const json = JSON.parse(jsonStr.trim());

        logger.info('Router decision', { promptLength: prompt.length, decision: json });

        return {
            provider: json.provider.includes('groq') ? 'groq' : json.provider.includes('gemini') ? 'gemini' : 'claude',
            model: json.model,
            reason: json.reason || 'Decisión dinámica del router'
        };

    } catch (err) {
        logger.error('Router fallback', { error: err });
        // Fallback seguro
        return {
            provider: 'groq',
            model: 'llama3-70b-8192',
            reason: 'Fallback por error en router → modelo potente'
        };
    }
}
