// lib/sce/brain-gobierno.ts
// Versión final integrada con scrapers v4.0

import { createClient } from '@supabase/supabase-js';
import { scrapeGobierno } from '../scraper/gobierno-scraper';
import { scrapeMazatlan } from '../scraper/mazatlan-scraper';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * Actualiza next_scrape_at basándose en éxito del scraping
 */
async function updateNextScrape(
  sourceId: string,
  eventsFound: number,
  stateSize: 'grande' | 'mediana' | 'pequeña'
) {
  let daysToAdd = 7; // Default

  // Ajustar frecuencia basándose en éxito
  if (eventsFound === 0) {
    // Si no encontró eventos, aumentar intervalo
    daysToAdd = stateSize === 'grande' ? 7 : stateSize === 'mediana' ? 10 : 14;
  } else if (eventsFound >= 10) {
    // Si encontró muchos, scrapear más seguido
    daysToAdd = stateSize === 'grande' ? 3 : stateSize === 'mediana' ? 5 : 7;
  } else {
    // Frecuencia normal
    daysToAdd = stateSize === 'grande' ? 5 : stateSize === 'mediana' ? 7 : 10;
  }

  await supabase
    .from('sce_sources')
    .update({
      last_scraped_at: new Date().toISOString(),
      fail_count: 0, // Reset fail count en scrape exitoso
    })
    .eq('id', sourceId);
}

/**
 * Cerebro Gobierno - Brain principal para fuentes .gob.mx
 */
export async function runGobiernoBrain() {
  console.log('🧠 CEREBRO GOBIERNO v4.0 - Iniciando');

  const { data: sources, error } = await supabase
    .from('sce_sources')
    .select('*')
    .eq('brain_type', 'gobierno')
    .eq('is_active', true)
    .lte('next_scrape_at', new Date().toISOString())
    .order('priority', { ascending: true })
    .limit(20); // Max 20 por ejecución

  if (error) {
    console.error('❌ Error obteniendo fuentes:', error);
    return { success: 0, failed: 0 };
  }

  if (!sources || sources.length === 0) {
    console.log('✅ No hay fuentes pendientes de scraping');
    return { success: 0, failed: 0 };
  }

  console.log(`📋 ${sources.length} fuentes a scrapear`);

  let successCount = 0;
  let failCount = 0;

  for (const source of sources) {
    try {
      console.log(`🔍 Scrapeando: ${source.name}`);

      const scraperType = source.metadata?.scraper_type || 'generic';
      let events: any[] = [];

      // Usar scraper especializado o genérico
      if (scraperType === 'mazatlan') {
        events = await scrapeMazatlan(source);
      } else {
        events = await scrapeGobierno(source);
      }

      // Actualizar next_scrape_at
      const stateSize = determineStateSize(source.state);
      await updateNextScrape(source.id, events.length, stateSize);

      successCount++;
      console.log(`✅ ${source.name}: ${events.length} eventos`);

    } catch (error: any) {
      failCount++;
      console.error(`❌ Error en ${source.name}:`, error.message);

      // Incrementar fail_count
      await supabase
        .from('sce_sources')
        .update({
          fail_count: source.fail_count + 1,
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
          metadata: { error: error.message },
        });
      }
    }

    // Rate limiting entre sources
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log(`🎯 Resultado: ${successCount} éxitos, ${failCount} fallos`);
  return { success: successCount, failed: failCount };
}

/**
 * Determina tamaño del estado para ajustar frecuencia
 */
function determineStateSize(state: string): 'grande' | 'mediana' | 'pequeña' {
  const grandesEstados = [
    'Ciudad de México', 'México', 'Jalisco', 'Nuevo León', 'Puebla',
    'Guanajuato', 'Veracruz', 'Chiapas', 'Baja California'
  ];

  const medianasEstados = [
    'Sinaloa', 'Oaxaca', 'Chihuahua', 'Tamaulipas', 'Michoacán',
    'Guerrero', 'Sonora', 'Coahuila', 'Querétaro', 'San Luis Potosí'
  ];

  if (grandesEstados.includes(state)) return 'grande';
  if (medianasEstados.includes(state)) return 'mediana';
  return 'pequeña';
}
