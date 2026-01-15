require('dotenv').config({ path: '.env.local' }); // Cargar .env.local explícitamente
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ========================================
// CONFIGURACIÓN
// ========================================
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const BATCH_SIZE = 10;
const RATE_LIMIT_MS = 1000;
const MODEL_NAME = 'text-embedding-004';

// ========================================
// VALIDACIÓN DE ENVIRONMENT
// ========================================
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !GEMINI_API_KEY) {
    console.error('❌ Error: Faltan variables de entorno requeridas en .env.local:');
    if (!SUPABASE_URL) console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    if (!SUPABASE_SERVICE_KEY) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    if (!GEMINI_API_KEY) console.error('   - GEMINI_API_KEY');
    process.exit(1);
}

// ========================================
// INICIALIZACIÓN DE CLIENTES
// ========================================
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: MODEL_NAME });

// ========================================
// UTILIDADES
// ========================================
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const sanitizeText = (text) => {
    if (!text) return '';
    return String(text)
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s\u00C0-\u017F.,!?-]/g, '')
        .trim();
};

const combineTextForEmbedding = (row) => {
    const parts = [
        row.title || '',
        row.category || '',
        row.description || '',
        row.location_text || ''
    ];

    return parts
        .map(sanitizeText)
        .filter(p => p.length > 0)
        .join(' ');
};

// ========================================
// GENERACIÓN DE EMBEDDING
// ========================================
async function generateEmbedding(text) {
    try {
        const result = await embeddingModel.embedContent(text);
        const embedding = result.embedding;

        if (!Array.isArray(embedding.values) || embedding.values.length !== 768) {
            throw new Error(`Embedding inválido: esperaba 768 dimensiones, recibió ${embedding.values?.length || 0}`);
        }

        return embedding.values;
    } catch (error) {
        if (error.message.includes('404')) {
            console.error('❌ Error 404: El modelo text-embedding-004 no fue encontrado. Verifica tu API Key o región.');
        }
        console.error('Error generando embedding:', error.message);
        throw error;
    }
}

// ========================================
// PROCESAMIENTO DE CONTENIDO
// ========================================
async function processContent() {
    console.log('🧠 Iniciando generación de embeddings...\n');

    console.log('📊 Consultando registros sin embedding...');
    const { data: rows, error: fetchError } = await supabase
        .from('content')
        .select('id, title, description, category, location_text')
        //.is('embedding', null) // COMENTADO PARA FORZAR REGENERACIÓN SI ES NECESARIO OJO
        .is('embedding', null)
        .eq('active', true)
        .order('created_at', { ascending: false });

    if (fetchError) {
        console.error('❌ Error consultando Supabase:', fetchError);
        process.exit(1);
    }

    if (!rows || rows.length === 0) {
        console.log('✅ No hay registros pendientes. Todos tienen embeddings.');
        return;
    }

    console.log(`📋 Encontrados ${rows.length} registros sin embedding\n`);

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 1;

        try {
            const combinedText = combineTextForEmbedding(row);

            if (!combinedText || combinedText.length < 5) {
                console.log(`⚠️  [${rowNumber}/${rows.length}] ID ${row.id}: Texto insuficiente ("${combinedText}"), saltando...`);
                failed++;
                continue;
            }

            console.log(`🔄 [${rowNumber}/${rows.length}] Procesando: ${row.title}`);

            // Generar embedding
            const embedding = await generateEmbedding(combinedText);

            // Actualizar en Supabase
            const { error: updateError } = await supabase
                .from('content')
                .update({ embedding })
                .eq('id', row.id);

            if (updateError) {
                throw new Error(`Error actualizando Supabase: ${updateError.message}`);
            }

            console.log(`✅ [${rowNumber}/${rows.length}] Embedding guardado.`);
            succeeded++;

            if (i < rows.length - 1) {
                await sleep(RATE_LIMIT_MS);
            }

        } catch (error) {
            console.error(`❌ [${rowNumber}/${rows.length}] Failed:`, error.message);
            failed++;
            await sleep(RATE_LIMIT_MS);
        }
        processed++;
    }

    console.log('\n✨ Proceso completado');
    console.log(`✅ ${succeeded} Exitosos | ❌ ${failed} Fallidos`);
}

processContent();
