
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
      Eres un clasificador de contenido para VENUZ.
      Categoría objetivo: ${this.category}

      Datos crudos: ${JSON.stringify(rawData)}

      Devuelve SOLO JSON:
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
            const result = await model.generateContent(prompt);
            const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(responseText);

            return {
                ...parsed,
                source: rawData.source || 'unknown',
                id: rawData.id // Mantener ID si existe
            };
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
        try {
            const raw = await this.scrape();
            const processed = await Promise.all(raw.map(item => this.classifyAndClean(item)));
            // Filtrar items con score bajo
            return processed.filter(p => p.quality_score > 60);
        } catch (e) {
            console.error(`Error running SCE ${this.category}:`, e);
            return [];
        }
    }
}
