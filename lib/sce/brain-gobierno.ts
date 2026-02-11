// lib/sce/brain-gobierno.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface Source {
  id: string;
  brain_type: string;
  state: string;
  municipality: string | null;
  name: string;
  url: string;
  source_type: string;
  scrape_frequency_days: number;
  priority: number;
  metadata: any;
  fail_count: number;
}

export async function runGobiernoBrain() {
  console.log('🧠 CEREBRO GOBIERNO - Iniciando scraping');

  const { data: sources, error } = await supabase
    .from('sce_sources')
    .select('*')
    .eq('brain_type', 'gobierno')
    .eq('is_active', true)
    .lte('next_scrape_at', new Date().toISOString())
    .order('priority', { ascending: true })
    .limit(20); // Max 20 por ejecución para no saturar

  if (error) {
    console.error('❌ Error obteniendo fuentes:', error);
    return;
  }

  if (!sources || sources.length === 0) {
    console.log('✅ No hay fuentes pendientes de scraping');
    return;
  }

  console.log(`📋 ${sources.length} fuentes a scrapear`);

  let successCount = 0;
  let failCount = 0;

  for (const source of sources) {
    try {
      console.log(`🔍 Scrapeando: ${source.name}`);
      
      // TODO: Aquí iría el scraper real
      // const events = await scrapeSource(source);
      
      // Simulación temporal
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Actualizar última ejecución
      await supabase
        .from('sce_sources')
        .update({
          last_scraped_at: new Date().toISOString(),
          fail_count: 0
        })
        .eq('id', source.id);

      successCount++;
      console.log(`✅ ${source.name}: OK`);

    } catch (error: any) {
      failCount++;
      console.error(`❌ Error en ${source.name}:`, error.message);

      // Incrementar fail_count
      await supabase
        .from('sce_sources')
        .update({
          fail_count: source.fail_count + 1
        })
        .eq('id', source.id);

      // Crear alerta si falla 3+ veces
      if (source.fail_count + 1 >= 3) {
        await supabase.from('sce_alerts').insert({
          type: 'url_failed',
          severity: 'warning',
          title: `URL falló ${source.fail_count + 1} veces`,
          message: `${source.name} (${source.url}) ha fallado ${source.fail_count + 1} veces consecutivas.`,
          source_id: source.id,
          metadata: { error: error.message }
        });
      }
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2500));
  }

  console.log(`🎯 Resultado: ${successCount} éxitos, ${failCount} fallos`);
  return { success: successCount, failed: failCount };
}
