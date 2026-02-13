const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || require('dotenv').config({ path: '.env.local' }).parsed?.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || require('dotenv').config({ path: '.env.local' }).parsed?.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function deepDiagnosis() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║       🔬 DIAGNÓSTICO PROFUNDO DE VENUZ - ANTIGRAVITY     ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  // 1. Total de registros
  console.log("📊 1. CONTEO GENERAL DE CONTENIDO");
  console.log("─────────────────────────────────────────────────────────────");
  const { count: totalCount, error: countError } = await supabase
    .from('content')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.log(`   ❌ Error contando: ${countError.message}`);
  } else {
    console.log(`   Total de registros en tabla 'content': ${totalCount}`);
  }

  // 2. Registros por categoría
  console.log("\n📁 2. DISTRIBUCIÓN POR CATEGORÍA");
  console.log("─────────────────────────────────────────────────────────────");
  const { data: allContent } = await supabase.from('content').select('category');
  if (allContent) {
    const categories = {};
    allContent.forEach(item => {
      const cat = item.category || 'sin_categoria';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    Object.entries(categories).sort((a,b) => b[1] - a[1]).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} items`);
    });
  }

  // 3. Registros recientes (últimas 24h)
  console.log("\n🕐 3. ACTIVIDAD RECIENTE (últimas 24 horas)");
  console.log("─────────────────────────────────────────────────────────────");
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentData, count: recentCount } = await supabase
    .from('content')
    .select('title, source_url, created_at', { count: 'exact' })
    .gte('created_at', yesterday)
    .order('created_at', { ascending: false })
    .limit(5);

  console.log(`   Registros nuevos en 24h: ${recentCount || 0}`);
  if (recentData && recentData.length > 0) {
    console.log("   Últimos 5:");
    recentData.forEach((item, i) => {
      const time = new Date(item.created_at).toLocaleTimeString();
      console.log(`     ${i+1}. [${time}] ${item.title?.substring(0,40)}...`);
    });
  } else {
    console.log("   ⚠️ No hay registros nuevos en las últimas 24 horas.");
  }

  // 4. Estado de imágenes
  console.log("\n🖼️  4. ESTADO DE IMÁGENES");
  console.log("─────────────────────────────────────────────────────────────");
  const { data: imageData } = await supabase.from('content').select('image_url').limit(100);
  if (imageData) {
    const withImage = imageData.filter(i => i.image_url && i.image_url.length > 10).length;
    const noImage = imageData.length - withImage;
    console.log(`   Con imagen válida: ${withImage}`);
    console.log(`   Sin imagen: ${noImage}`);
    
    // Muestra ejemplos
    const example = imageData.find(i => i.image_url);
    if (example) {
      console.log(`   Ejemplo URL: ${example.image_url?.substring(0, 60)}...`);
    }
  }

  // 5. Fuentes de datos
  console.log("\n🌐 5. FUENTES DE DATOS (source_url)");
  console.log("─────────────────────────────────────────────────────────────");
  const { data: sourceData } = await supabase.from('content').select('source_url').limit(200);
  if (sourceData) {
    const sources = {};
    sourceData.forEach(item => {
      if (item.source_url) {
        const domain = item.source_url.includes('instagram') ? 'Instagram' :
                       item.source_url.includes('google') ? 'Google Maps' :
                       item.source_url.includes('twitter') ? 'Twitter' :
                       item.source_url.includes('TEST') ? 'Test Data' : 'Otro';
        sources[domain] = (sources[domain] || 0) + 1;
      }
    });
    Object.entries(sources).forEach(([source, count]) => {
      console.log(`   ${source}: ${count} items`);
    });
  }

  // 6. Verificar si hay contenido de los scrapers de Claude
  console.log("\n🤖 6. VERIFICACIÓN DE SCRAPERS (cuentas reales de PV)");
  console.log("─────────────────────────────────────────────────────────────");
  const pvAccounts = ['reinasbarpv', 'anonimobar', 'garbo_pianobar', 'mandalavallarta', 'blondiespv'];
  let foundFromScrapers = 0;
  for (const account of pvAccounts) {
    const { count } = await supabase
      .from('content')
      .select('*', { count: 'exact', head: true })
      .ilike('source_url', `%${account}%`);
    if (count && count > 0) {
      console.log(`   ✅ ${account}: ${count} posts encontrados`);
      foundFromScrapers += count;
    }
  }
  if (foundFromScrapers === 0) {
    console.log("   ⚠️ No se encontraron datos de las cuentas de PV que Claude configuró.");
    console.log("   Esto puede significar que los scrapers aún no han corrido.");
  }

  // Resumen final
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║                    📋 RESUMEN FINAL                       ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`   Total contenido: ${totalCount || 0} registros`);
  console.log(`   Nuevos (24h): ${recentCount || 0} registros`);
  console.log(`   Scrapers PV: ${foundFromScrapers > 0 ? '✅ Activos' : '⚠️ Pendientes'}`);
  
  if ((totalCount || 0) > 100 && (recentCount || 0) > 0) {
    console.log("\n   ✅ VEREDICTO: La app DEBERÍA mostrar contenido.");
  } else if ((totalCount || 0) > 0) {
    console.log("\n   ⚠️ VEREDICTO: Hay contenido pero puede estar desactualizado.");
  } else {
    console.log("\n   ❌ VEREDICTO: Sin contenido. Los scrapers no han enviado datos.");
  }
}

deepDiagnosis().catch(console.error);
