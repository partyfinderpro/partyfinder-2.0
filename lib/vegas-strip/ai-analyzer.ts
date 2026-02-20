import Groq from 'groq-sdk';

const logger = console;

// Lazy init Groq client (only when needed, avoids issues during build)
let groqClient: Groq | null = null;
function getGroq(): Groq | null {
    if (groqClient) return groqClient;
    const key = process.env.GROQ_API_KEY;
    if (!key || key === 'dummy') {
        logger.warn('[AI Analyzer] GROQ_API_KEY not set, using fallback mock');
        return null;
    }
    groqClient = new Groq({ apiKey: key });
    return groqClient;
}

export interface AnalysisResult {
    rewrittenTitle: string;
    rewrittenDescription: string;
    suggestedTags: string[];
    qualityScore: number;
    eleganceScore: number;
    trendingScore: number;
    vibe?: string[];
}

export class AiContentAnalyzer {

    /**
     * Analyzes a scraped item using Groq LLM.
     * Falls back to passthrough if Groq is unavailable or errors.
     */
    async analyzeItem(title: string, description: string, category: string): Promise<AnalysisResult> {
        const groq = getGroq();

        // Fallback: If no Groq key, use intelligent mock
        if (!groq) {
            return this.fallbackAnalysis(title, description, category);
        }

        try {
            const prompt = `Eres un editor de contenido premium para una app de nightlife/entretenimiento adulto llamada VENUZ.

Analiza este contenido scrapeado y mejóralo:

Título original: "${title}"
Descripción original: "${description}"
Categoría: "${category}"

Instrucciones:
1. Reescribe el título para ser más atractivo y premium (sin vulgaridad explícita, máx 80 chars)
2. Reescribe la descripción para ser más engaging (máx 200 chars)
3. Puntúa calidad de 0-100 basado en: ¿tiene información útil? ¿es contenido original? ¿es relevante?
4. Sugiere 3-5 tags relevantes
5. Clasifica el vibe: high_energy, chill_seductive, digital_fantasy, o default

Responde SOLO un JSON válido, sin markdown, sin explicación:
{"rewrittenTitle": "...", "rewrittenDescription": "...", "qualityScore": 0-100, "eleganceScore": 0-100, "trendingScore": 0-100, "suggestedTags": ["tag1", "tag2"], "vibe": ["vibe1"]}`;

            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.1-8b-instant', // Fast & cheap model for content analysis
                temperature: 0.6,
                max_tokens: 400,
                response_format: { type: 'json_object' }, // Force JSON output
            });

            const content = completion.choices[0]?.message?.content || '{}';

            // Parse JSON safely
            const parsed = this.safeParseJSON(content);

            if (parsed && parsed.rewrittenTitle) {
                logger.info(`[AI Analyzer] ✅ Analyzed: "${title.substring(0, 30)}..." → "${parsed.rewrittenTitle.substring(0, 30)}..."`);
                return {
                    rewrittenTitle: parsed.rewrittenTitle || title,
                    rewrittenDescription: parsed.rewrittenDescription || description,
                    suggestedTags: parsed.suggestedTags || [category],
                    qualityScore: this.clampScore(parsed.qualityScore),
                    eleganceScore: this.clampScore(parsed.eleganceScore),
                    trendingScore: this.clampScore(parsed.trendingScore),
                    vibe: parsed.vibe,
                };
            }

            // If JSON parse failed, fallback
            logger.warn('[AI Analyzer] JSON parse incomplete, using fallback');
            return this.fallbackAnalysis(title, description, category);

        } catch (err: any) {
            // Rate limit, network error, etc → graceful fallback
            logger.error('[AI Analyzer] Groq call failed:', err.message);
            return this.fallbackAnalysis(title, description, category);
        }
    }

    /**
     * Intelligent fallback when Groq is unavailable.
     * Better than pure passthrough: does basic quality heuristics.
     */
    private fallbackAnalysis(title: string, description: string, category: string): AnalysisResult {
        // Basic quality heuristic based on content length and features
        let qualityScore = 50;

        // Title quality
        if (title.length > 10) qualityScore += 10;
        if (title.length > 30) qualityScore += 5;
        if (title.includes('...')) qualityScore -= 10; // Truncated = low quality

        // Description quality
        if (description && description.length > 20) qualityScore += 10;
        if (description && description.length > 100) qualityScore += 10;

        // Category bonus (some categories are inherently higher value)
        const highValueCategories = ['webcam', 'club', 'bar', 'soltero', 'evento'];
        if (highValueCategories.includes(category)) qualityScore += 5;

        // Clamp
        qualityScore = Math.max(30, Math.min(95, qualityScore));

        return {
            rewrittenTitle: title,
            rewrittenDescription: description,
            suggestedTags: [category, 'trending', 'vegas-strip'],
            qualityScore,
            eleganceScore: Math.max(40, qualityScore - 10),
            trendingScore: Math.max(30, qualityScore - 15),
        };
    }

    private safeParseJSON(str: string): any {
        try {
            // Try direct parse
            return JSON.parse(str);
        } catch {
            try {
                // Try extracting JSON from markdown code block
                const match = str.match(/\{[\s\S]*\}/);
                if (match) return JSON.parse(match[0]);
            } catch {
                // Give up
            }
            return null;
        }
    }

    private clampScore(score: any): number {
        const num = typeof score === 'number' ? score : parseInt(score) || 50;
        return Math.max(0, Math.min(100, num));
    }
}

export const aiContentAnalyzer = new AiContentAnalyzer();
