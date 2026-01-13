const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ⚙️ CONFIGURATION
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
const MODEL_NAME = 'gemini-flash-latest';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function curateWithGemini(item) {
    if (!API_KEY) {
        throw new Error('Missing GEMINI_API_KEY');
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

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
3. Clasifica el lugar con UN solo término de esta lista EXACTA (en minúsculas): club, beach, bar, restaurant, show, escort, masaje, tabledance. (Usa 'club' para Nightclubs/Antros, 'beach' para Beach Clubs, 'show' para eventos/conciertos).
4. Genera 3 keywords relevantes (ej: "Open-air, House Music, Ocean View").

RESPONDE ÚNICAMENTE EN FORMATO JSON VÁLIDO (sin bloques de código markdown):
{
  "title": "Título Mejorado",
  "description": "Descripción premium...",
  "category": "Categoría Correcta",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Limpiamos si Gemini devuelve markdown
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(text);
    } catch (error) {
        console.log(`❌ Error con Gemini para "${item.title}":`, error);
        if (error.response) {
            console.log('Error details:', JSON.stringify(error.response, null, 2));
        }
        return null;
    }
}

async function main() {
    console.log('🤖 Iniciando Curador Autónomo VENUZ (Powered by Gemini SDK)...');
    console.log(`🔑 Usando modelo: ${MODEL_NAME}`);

    if (!API_KEY) {
        console.error('❌ La API Key de Gemini no está configurada.');
        process.exit(1);
    }

    // Buscamos items para curar
    const { data: items, error } = await supabase
        .from('content')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Error al leer Supabase:', error);
        return;
    }

    console.log(`📦 Encontrados ${items.length} items para curar.`);

    for (const item of items) {
        console.log(`\n✨ Curando: "${item.title}"...`);

        // Rate limit preventivo
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
