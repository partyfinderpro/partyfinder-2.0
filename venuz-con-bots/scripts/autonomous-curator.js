const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// ⚙️ CONFIGURATION
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function curateWithClaude(item) {
    if (!ANTHROPIC_API_KEY) {
        throw new Error('Missing ANTHROPIC_API_KEY');
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
3. Clasifica el lugar con UN solo término de esta lista: Nightclub, Beach Club, Bar, Restaurant, Lounge, Adult Entertainment, Spa.
4. Genera 3 keywords relevantes (ej: "Open-air, House Music, Ocean View").

RESPONDE ÚNICAMENTE EN FORMATO JSON:
{
  "title": "Título Mejorado",
  "description": "Descripción premium...",
  "category": "Categoría Correcta",
  "keywords": "keyword1, keyword2, keyword3"
}`;

    try {
        const response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: 'claude-3-haiku-20240307',
                max_tokens: 500,
                messages: [{ role: 'user', content: prompt }]
            },
            {
                headers: {
                    'x-api-key': ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                }
            }
        );

        const resultText = response.data.content[0].text;
        return JSON.parse(resultText);
    } catch (error) {
        console.error(`❌ Error con Claude para "${item.title}":`, error.response?.data || error.message);
        return null;
    }
}

async function main() {
    console.log('🤖 Iniciando Curador Autónomo VENUZ...');

    if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY.includes('...')) {
        console.error('❌ La API Key de Anthropic parece estar truncada o no configurada.');
        process.exit(1);
    }

    // 1. Obtener items que no han sido curados
    // Usamos metadata->'curated_by_ai' para trackear
    const { data: items, error } = await supabase
        .from('content')
        .select('*')
        .or('metadata->curated_by_ai.is.null,metadata->curated_by_ai.eq.false')
        .limit(5); // Empezamos pequeño para probar

    if (error) {
        console.error('Error al leer Supabase:', error);
        return;
    }

    console.log(`📦 Encontrados ${items.length} items para curar.`);

    for (const item of items) {
        console.log(`\n✨ Curando: "${item.title}"...`);

        const curated = await curateWithClaude(item);

        if (curated) {
            console.log(`   ✅ Claude respondió: ${curated.title}`);

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
                        curation_date: new Date().toISOString()
                    }
                })
                .eq('id', item.id);

            if (!updateError) console.log('   💾 Base de datos actualizada.');
            else console.error('   ❌ Error al actualizar:', updateError.message);
        }

        // Delay para evitar rate limits
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('\n🏁 Curación terminada.');
}

main();
