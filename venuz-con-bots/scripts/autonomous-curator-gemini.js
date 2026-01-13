const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// ⚙️ CONFIGURATION
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY; // User said they use the same key or just gave this one
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function curateWithGemini(item) {
    if (!GOOGLE_API_KEY) {
        throw new Error('Missing GOOGLE_PLACES_API_KEY (used for Gemini)');
    }

    const prompt = `Actúa como un experto en vida nocturna y turismo premium en Puerto Vallarta. 
Tu tarea es mejorar la información de este lugar para una aplicación móvil de lujo (VENUZ).

DATOS CRUDOS:
Título: ${item.title}
Descripción actual: ${item.description || 'N/A'}
Categoría actual: ${item.category || 'N/A'}
Ubicación detectada: ${item.location_text || 'Puerto Vallarta'}

INSTRUCCIONES:
1. Mejora el título si está sucio (ej: "MANDALA PV" -> "Mandala Puerto Vallarta").
2. Escribe una descripción SEDUCTORA y corta (máx 250 caracteres) en español. Usa un tono premium, vibrante y exclusivo.
3. Clasifica el lugar con UN solo término de esta lista: Nightclub, Beach Club, Bar, Restaurant, Lounge, Adult Entertainment, Spa, Evento.
4. Genera 3 keywords relevantes (ej: "Open-air, House Music, Ocean View").

RESPONDE ÚNICAMENTE EN FORMATO JSON VÁLIDO (sin bloques de código markdown):
{
  "title": "Título Mejorado",
  "description": "Descripción premium...",
  "category": "Categoría Correcta",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GOOGLE_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];

        if (!candidate) return null;

        let text = candidate.content.parts[0].text;

        // Limpiamos si Gemini devuelve markdown
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(text);
    } catch (error) {
        console.error(`❌ Error con Gemini para "${item.title}":`, error.message);
        return null;
    }
}

async function main() {
    console.log('🤖 Iniciando Curador Autónomo VENUZ (Powered by Gemini)...');

    if (!GOOGLE_API_KEY) {
        console.error('❌ La API Key de Google no está configurada.');
        process.exit(1);
    }

    // 1. Obtener items que no han sido curados por AI (o forzar recura de algunos para probar)
    // Buscamos items donde la ultima curacion NO fue hecha por AI hoy
    // Para simplificar, tomamos los ultimos 5 items creados o actualizados
    const { data: items, error } = await supabase
        .from('content')
        .select('*')
        // .or('metadata->curated_by_ai.is.null,metadata->curated_by_ai.eq.false') // Descomentar para producción
        .limit(5); // Prueba con 5

    if (error) {
        console.error('Error al leer Supabase:', error);
        return;
    }

    console.log(`📦 Encontrados ${items.length} items para curar.`);

    for (const item of items) {
        console.log(`\n✨ Curando: "${item.title}"...`);

        // Rate limit preventivo: Gemini gratuito tiene limites
        await new Promise(r => setTimeout(r, 2000));

        const curated = await curateWithGemini(item);

        if (curated) {
            console.log(`   ✅ Gemini respondió: ${curated.title}`);
            console.log(`      "${curated.description.substring(0, 50)}..."`);

            const { error: updateError } = await supabase
                .from('content')
                .update({
                    title: curated.title,
                    description: curated.description,
                    category: curated.category,
                    keywords: curated.keywords,
                    metadata: {
                        ...(item.metadata || {}),
                        curated_by_ai: true,
                        curation_provider: 'gemini',
                        curation_date: new Date().toISOString()
                    }
                })
                .eq('id', item.id);

            if (!updateError) console.log('   💾 Base de datos actualizada.');
            else console.error('   ❌ Error al actualizar:', updateError.message);
        } else {
            console.log('   ⚠️ No se pudo curar.');
        }
    }

    console.log('\n🏁 Curación terminada.');
}

main();
