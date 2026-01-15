// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// ========================================
// CONFIGURACIÓN
// ========================================
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ========================================
// TIPOS
// ========================================
interface SearchRequest {
    query: string;
    threshold?: number;
    limit?: number;
}

interface SearchResult {
    id: string;
    title: string;
    description: string | null;
    category: string;
    image_url: string | null;
    url: string | null;
    location_text: string | null;
    latitude: number | null;
    longitude: number | null;
    similarity: number;
    created_at: string;
}

// ========================================
// HANDLER POST
// ========================================
export async function POST(request: NextRequest) {
    try {
        // 1. Validar input
        const body: SearchRequest = await request.json();
        const { query, threshold = 0.5, limit = 10 } = body; // Reduced threshold for better results

        if (!query || query.trim().length === 0) {
            return NextResponse.json(
                { error: 'Query es requerido' },
                { status: 400 }
            );
        }

        if (query.length > 500) {
            return NextResponse.json(
                { error: 'Query demasiado largo (máx 500 caracteres)' },
                { status: 400 }
            );
        }

        console.log(`🔍 Búsqueda semántica: "${query}"`);

        // 2. Generar embedding de la query
        const startEmbedding = Date.now();
        const result = await embeddingModel.embedContent(query.trim());
        const queryEmbedding = result.embedding.values;

        if (!Array.isArray(queryEmbedding) || queryEmbedding.length !== 768) {
            throw new Error('Embedding inválido generado por Gemini');
        }

        const embeddingTime = Date.now() - startEmbedding;
        console.log(`✅ Embedding generado en ${embeddingTime}ms`);

        // 3. Buscar en Supabase usando RPC
        const startSearch = Date.now();
        const { data, error } = await supabase.rpc('match_content', {
            query_embedding: queryEmbedding,
            match_threshold: threshold,
            match_count: limit
        });

        if (error) {
            console.error('Error en RPC match_content:', error);
            throw error;
        }

        const searchTime = Date.now() - startSearch;
        console.log(`✅ Búsqueda completada en ${searchTime}ms`);
        console.log(`📊 Resultados encontrados: ${data?.length || 0}`);

        // 4. Retornar resultados
        return NextResponse.json({
            success: true,
            query,
            results: data as SearchResult[],
            meta: {
                count: data?.length || 0,
                threshold,
                embeddingTime,
                searchTime,
                totalTime: embeddingTime + searchTime
            }
        });

    } catch (error: any) {
        console.error('❌ Error en búsqueda semántica:', error);

        return NextResponse.json(
            {
                error: 'Error procesando búsqueda',
                details: error.message
            },
            { status: 500 }
        );
    }
}

// ========================================
// HANDLER GET (Para testing rápido)
// ========================================
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json(
            { error: 'Parámetro "q" es requerido' },
            { status: 400 }
        );
    }

    // Reusar la lógica del POST
    return POST(
        new NextRequest(request.url, {
            method: 'POST',
            body: JSON.stringify({ query })
        })
    );
}
