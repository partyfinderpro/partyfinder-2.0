// ============================================
// VENUZ SCE: Cerebro Clasificador Cognitivo
// /app/api/cognitive/classify/route.ts
// 
// Recibe contenido crudo de scrapers →
// LLM clasifica y evalúa calidad →
// Inserta en pending_events si aprobado
// ============================================

import { NextResponse } from 'next/server';

// NOTA: En Edge Runtime no podemos usar el SDK de Anthropic ni supabase-js
// porque requieren Node.js APIs. Usamos fetch directo.

export const runtime = 'edge';

// System prompt con la misión VENUZ inyectada
const SYSTEM_PROMPT = `Eres el cerebro clasificador de VENUZ, la plataforma definitiva de entretenimiento y diversión en México. Tu misión es evaluar contenido scrapeado y decidir si vale la pena mostrarlo a usuarios que buscan pasarla bien.

REGLAS INQUEBRANTABLES:
1. SOLO aceptar contenido que aporte valor real: ofertas irresistibles (2x1, barra libre, ladies night, descuentos reales), lugares verificados, eventos confirmados, contenido adulto premium con trials/ofertas.
2. RECHAZAR: spam, contenido de baja calidad, duplicados obvios, contenido ilegal, estafas, catfish.
3. CATEGORÍAS VÁLIDAS (usa EXACTAMENTE una): comida, antro, table_dance, scort, porno_premium, sexshop, concierto, fiesta_patronal, bar, evento, webcam, masaje, soltero
4. SCORING (1-100):
   - 90-100: Oferta increíble, verificada, con imágenes, en zona caliente
   - 70-89: Buen contenido, relevante, atractivo
   - 50-69: Contenido aceptable pero genérico
   - 1-49: No vale la pena → rechazar (approved: false)
5. EQUILIBRIO: Si detectas que es otra webcam más sin nada especial, baja el score. Variedad > cantidad.

RESPONDE ÚNICAMENTE con JSON válido, sin markdown, sin backticks, sin explicaciones fuera del JSON:
{
  "approved": boolean,
  "reason": "explicación breve en español max 100 chars",
  "title": "título limpio y atractivo max 80 chars",
  "description": "descripción persuasiva max 200 chars",
  "category": "categoría exacta de la lista",
  "quality_score": número 1-100,
  "is_adult": boolean,
  "lat": número o null,
  "lng": número o null
}`;

// Llamar a Google Gemini API directamente con fetch (Edge compatible)
async function callLLM(rawData: Record<string, unknown>): Promise<Record<string, unknown>> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: SYSTEM_PROMPT }],
                },
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: `Evalúa este contenido y responde SOLO JSON válido, sin backticks ni markdown:\n${JSON.stringify(rawData)}`,
                            },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 0.2, // Bajo para respuestas consistentes
                    maxOutputTokens: 512,
                },
            }),
        }
    );

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Limpiar posibles backticks o markdown del response
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
}

// Insertar en Supabase via REST API (Edge compatible)
async function insertPending(
    classification: Record<string, unknown>,
    rawData: any,
    sourceScraper: string
): Promise<{ error: string | null }> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        return { error: 'Supabase credentials not configured' };
    }

    const payload = {
        raw_title: rawData.title || classification.title,
        raw_description: rawData.description || classification.description,
        raw_image_url: rawData.image_url || rawData.images?.[0] || null,
        raw_source_url: rawData.source_url || rawData.url || null,
        raw_lat: classification.lat || rawData.lat || null,
        raw_lng: classification.lng || rawData.lng || null,
        raw_data: rawData,
        suggested_category: classification.category,
        suggested_title: classification.title,
        suggested_description: classification.description,
        quality_score_suggested: classification.quality_score,
        is_adult: classification.is_adult || false,
        reason: classification.reason,
        source_scraper: sourceScraper,
        status: 'pending',
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/pending_events`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Prefer': 'return=minimal',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errText = await response.text();
        return { error: `Supabase insert failed: ${errText}` };
    }

    return { error: null };
}

// Verificar si ya existe un item con la misma URL (anti-duplicados)
async function checkDuplicate(sourceUrl: string): Promise<boolean> {
    if (!sourceUrl) return false;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return false;

    // Verificar en pending_events
    const urlHash = await digestMessage(sourceUrl);
    const response = await fetch(
        `${supabaseUrl}/rest/v1/pending_events?source_url_hash=eq.${urlHash}&select=id&limit=1`,
        {
            headers: {
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`,
            },
        }
    );

    if (response.ok) {
        const data = await response.json();
        if (data.length > 0) return true;
    }

    // También verificar en content
    const contentResponse = await fetch(
        `${supabaseUrl}/rest/v1/content?source_url=eq.${encodeURIComponent(sourceUrl)}&select=id&limit=1`,
        {
            headers: {
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`,
            },
        }
    );

    if (contentResponse.ok) {
        const contentData = await contentResponse.json();
        if (contentData.length > 0) return true;
    }

    return false;
}

// MD5 hash simple para Edge Runtime
async function digestMessage(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('MD5', data).catch(() => {
        // Fallback si MD5 no está disponible en Edge
        return crypto.subtle.digest('SHA-256', data);
    });
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================
// ENDPOINT PRINCIPAL
// ============================================
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { raw_data, source_scraper = 'unknown' } = body;

        // Validación
        if (!raw_data || typeof raw_data !== 'object') {
            return NextResponse.json(
                { error: 'Se requiere raw_data como objeto JSON' },
                { status: 400 }
            );
        }

        // Anti-duplicados
        const sourceUrl = raw_data.source_url || raw_data.url || '';
        if (sourceUrl) {
            const isDuplicate = await checkDuplicate(sourceUrl);
            if (isDuplicate) {
                return NextResponse.json({
                    classification: { approved: false, reason: 'Duplicado detectado' },
                    action: 'skipped_duplicate',
                });
            }
        }

        // Clasificar con LLM
        const classification = await callLLM(raw_data);

        // Si aprobado, insertar en pending_events
        let action = 'rejected';
        if (classification.approved) {
            const { error } = await insertPending(classification, raw_data, source_scraper);
            if (error) {
                console.error('Insert error:', error);
                return NextResponse.json(
                    { error: 'Clasificación exitosa pero fallo al guardar', classification },
                    { status: 500 }
                );
            }
            action = 'inserted_pending';
        }

        return NextResponse.json({
            classification,
            action,
            source_scraper,
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Cognitive classify error:', message);
        return NextResponse.json(
            { error: 'Error en clasificación cognitiva', detail: message },
            { status: 500 }
        );
    }
}

// ============================================
// BATCH: Procesar múltiples items
// ============================================
export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { items, source_scraper = 'unknown' } = body;

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: 'Se requiere array "items" con al menos 1 elemento' },
                { status: 400 }
            );
        }

        // Limitar batch a 10 items para no exceder timeout de Edge
        const batch = items.slice(0, 10);
        const results = [];

        for (const item of batch) {
            try {
                // Anti-duplicados
                const sourceUrl = item.source_url || item.url || '';
                if (sourceUrl) {
                    const isDuplicate = await checkDuplicate(sourceUrl);
                    if (isDuplicate) {
                        results.push({ title: item.title, action: 'skipped_duplicate' });
                        continue;
                    }
                }

                const classification = await callLLM(item);

                if (classification.approved) {
                    await insertPending(classification, item, source_scraper);
                    results.push({
                        title: classification.title,
                        action: 'inserted_pending',
                        score: classification.quality_score,
                        category: classification.category,
                    });
                } else {
                    results.push({
                        title: item.title,
                        action: 'rejected',
                        reason: classification.reason,
                    });
                }
            } catch (itemError) {
                results.push({
                    title: item.title,
                    action: 'error',
                    error: itemError instanceof Error ? itemError.message : 'Unknown',
                });
            }
        }

        const approved = results.filter(r => r.action === 'inserted_pending').length;
        const rejected = results.filter(r => r.action === 'rejected').length;
        const duplicates = results.filter(r => r.action === 'skipped_duplicate').length;
        const errors = results.filter(r => r.action === 'error').length;

        return NextResponse.json({
            summary: { total: batch.length, approved, rejected, duplicates, errors },
            results,
            remaining: items.length > 10 ? items.length - 10 : 0,
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Error en batch cognitivo', detail: message },
            { status: 500 }
        );
    }
}
