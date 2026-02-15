
import { llmRouter } from "@/lib/llm-router";
import { createClient } from "@supabase/supabase-js";

// Init Supabase for closed loop tracking (Lazy Init)
function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export interface SCEOutput {
    id?: string;
    category: string;
    title: string;
    description: string;
    image_url: string;
    location?: { lat: number; lng: number };
    keywords: string[];
    quality_score: number;
    source: string;
}

export abstract class BaseSCE {
    protected category: string;

    constructor(category: string) {
        this.category = category;
    }

    abstract scrape(): Promise<any[]>; // implementar por categoría

    async classifyAndClean(rawData: any): Promise<SCEOutput> {
        const prompt = `
      Eres un clasificador de contenido para VENUZ.
      Categoría objetivo: ${this.category}

      Datos crudos: ${JSON.stringify(rawData)}

      Devuelve SOLO JSON válido, sin markdown ni backticks:
      {
        "title": "título limpio y atractivo",
        "description": "descripción optimizada, 100-200 caracteres",
        "keywords": ["array", "de", "5-10", "palabras clave"],
        "quality_score": 0-100 (basado en cuán atractivo es para fiesta/nightlife),
        "image_url": "mejor imagen disponible o placeholder",
        "category": "${this.category}"
      }
    `;

        try {
            // Usar LLM Router para clasificación
            const responseText = await llmRouter.generateContent(prompt, {
                temperature: 0.2, // Baja temperatura para JSON consistente
                maxTokens: 500
            });

            // Limpieza robusta de JSON (algunos LLMs envían markdown)
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);

            const result: SCEOutput = {
                ...parsed,
                source: rawData.source || 'unknown',
                id: rawData.id // Mantener ID si existe
            };

            // Closed-Loop: Guardar registro de la "mejora" (transformación)
            // Solo si tiene ID (aunque al ser scraped nuevo igual no tiene ID de DB aún, 
            // pero guardamos el rastro para análisis futuro)
            // Lazy load supabase here
            if (result.quality_score > 60) {
                const supabase = getSupabase();

                await supabase.from('content_improvements').insert({
                    original_content_id: null, // No hay ID de DB estable aún
                    improved_title: result.title,
                    improved_description: result.description,
                    keywords: result.keywords,
                    quality_score_before: 0, // Asumimos 0 para scraper raw
                    quality_score_after: result.quality_score,
                    provider_used: 'llm-router'
                }).select().then(({ error }) => {
                    if (error) console.warn('[BaseSCE] Error saving improvement record:', error.message);
                });
            }

            return result;

        } catch (e) {
            console.error("Error classifying item:", e);
            // Fallback básico
            return {
                title: rawData.title || "Sin título",
                description: rawData.description || "Sin descripción",
                category: this.category,
                image_url: rawData.image_url || "",
                keywords: [],
                quality_score: 50,
                source: rawData.source || 'unknown'
            };
        }
    }

    async run(): Promise<SCEOutput[]> {
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                const raw = await this.scrape();
                const processed = await Promise.all(raw.map(item => this.classifyAndClean(item)));

                // Filtrar items con score bajo
                const validItems = processed.filter(p => p.quality_score > 60);

                if (validItems.length === 0 && raw.length > 0) {
                    console.warn(`[SCE ${this.category}] Warning: Scraped items found but rejected by QA.`);
                }

                return validItems;

            } catch (e: any) {
                attempts++;
                console.warn(`[SCE ${this.category}] Fallo intento ${attempts}/${maxAttempts}:`, e.message);

                if (attempts === maxAttempts) {
                    console.error(`[SCE ${this.category}] CRITICAL: Self-healing failed after ${maxAttempts} attempts.`);
                    // Aquí se podría notificar a un sistema de alertas (ej: Telegram)
                    return [];
                }

                // Esperar antes de reintentar (backoff exponencial simple)
                await new Promise(r => setTimeout(r, 2000 * attempts));
            }
        }
        return [];
    }
}
