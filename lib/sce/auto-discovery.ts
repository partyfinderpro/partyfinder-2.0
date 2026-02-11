// lib/sce/auto-discovery.ts
import { createClient } from '@supabase/supabase-js';
import { sendTelegramAlert } from './alert-system';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * Auto-descubrimiento de URLs alternativas cuando una fuente falla
 */
export async function autoDiscoverAlternatives(sourceId: string, sourceName: string, state: string) {
  console.log(`🔍 Auto-discovery para: ${sourceName}`);

  try {
    // Construir query de búsqueda
    const queries = [
      `agenda eventos ${state} gob.mx`,
      `cultura ${state} gob.mx eventos`,
      `turismo ${state} gob.mx cartelera`,
    ];

    const discoveredUrls: string[] = [];

    for (const query of queries) {
      // En producción, usar SerpAPI o Google Custom Search API
      // Por ahora, patrones comunes de URLs .gob.mx
      const patterns = [
        `https://cultura.${state.toLowerCase().replace(' ', '')}.gob.mx/`,
        `https://turismo.${state.toLowerCase().replace(' ', '')}.gob.mx/`,
        `https://www.${state.toLowerCase().replace(' ', '')}.gob.mx/cultura`,
      ];

      for (const url of patterns) {
        if (!discoveredUrls.includes(url)) {
          discoveredUrls.push(url);
        }
      }
    }

    // Guardar URLs descubiertas
    for (const url of discoveredUrls) {
      await supabase.from('sce_alternative_urls').insert({
        source_id: sourceId,
        url: url,
        confidence_score: 0.75,
        is_active: true,
      });
    }

    if (discoveredUrls.length > 0) {
      await sendTelegramAlert(
        `🔍 Auto-discovery: ${discoveredUrls.length} alternativas encontradas para ${sourceName}`,
        'info'
      );
    }

    return discoveredUrls;

  } catch (error: any) {
    console.error('❌ Error en auto-discovery:', error.message);
    return [];
  }
}

/**
 * Ejecutar auto-discovery en fuentes con 3+ fallos
 */
export async function runAutoDiscovery() {
  console.log('🔍 Ejecutando auto-discovery en fuentes problemáticas');

  const { data: failedSources } = await supabase
    .from('sce_sources')
    .select('*')
    .gte('fail_count', 3)
    .eq('is_active', true);

  if (!failedSources || failedSources.length === 0) {
    console.log('✅ No hay fuentes que requieran auto-discovery');
    return;
  }

  console.log(`📋 ${failedSources.length} fuentes necesitan alternativas`);

  for (const source of failedSources) {
    const alternatives = await autoDiscoverAlternatives(
      source.id,
      source.name,
      source.state || 'México'
    );

    console.log(`  → ${source.name}: ${alternatives.length} alternativas`);
  }
}
