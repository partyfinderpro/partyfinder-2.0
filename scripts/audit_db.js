require('dotenv').config();
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runAudit() {
    console.log('--- 📊 AUDITORÍA DE BASE DE DATOS VENUZ ---');

    try {
        // 1. Contenido por categoría
        console.log('\n[1] Contenido Activo por Categoría:');
        const { data: allContent, error: fetchError } = await supabase
            .from('content')
            .select('category')
            .eq('active', true);

        if (fetchError) throw fetchError;

        const counts = allContent.reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + 1;
            return acc;
        }, {});

        console.table(Object.entries(counts).map(([cat, total]) => ({ category: cat, total })));

        // 2. Última inserción por fuente
        console.log('\n[2] Última Inserción por Fuente (source_site):');
        const { data: sourceData, error: sError } = await supabase
            .from('content')
            .select('source_site, created_at');

        if (sError) throw sError;

        const sourceSummary = sourceData.reduce((acc, curr) => {
            const src = curr.source_site || 'unknown';
            if (!acc[src] || new Date(curr.created_at) > new Date(acc[src].last)) {
                acc[src] = { last: curr.created_at, count: (acc[src]?.count || 0) + 1 };
            } else {
                acc[src].count++;
            }
            return acc;
        }, {});
        console.table(Object.entries(sourceSummary).map(([src, info]) => ({ source: src, last: info.last, total: info.count })));


        // 3. Tablas de Highway v4
        console.log('\n[3] Verificando Tablas de Sistema:');
        const systemTables = ['feed_cache', 'user_engagement', 'algorithm_config', 'user_intents'];
        for (const table of systemTables) {
            const { error } = await supabase.from(table).select('*', { count: 'exact', head: true }).limit(1);
            console.log(`${table.padEnd(20)}: ${error ? '❌ NO EXISTE' : '✅ ACTIVA'}`);
        }

        // 4. Verificación de contenido reciente (últimas 48h)
        console.log('\n[4] Contenido reciente (últimas 48h):');
        const recentDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const { count: recentCount } = await supabase
            .from('content')
            .select('*', { count: 'exact', head: true })
            .gt('created_at', recentDate);

        console.log(`Registros insertados en las últimas 48h: ${recentCount || 0}`);

    } catch (err) {
        console.error('❌ Error en la auditoría:', err.message);
    }

    console.log('\n--- FIN DE AUDITORÍA ---');
}

runAudit();
