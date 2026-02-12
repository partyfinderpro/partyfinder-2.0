// lib/scraper/utils/deduplication.ts
// Sistema de deduplicación de eventos

import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  }

  return createClient(url, key);
};

/**
 * Normaliza un título para comparación
 * - Lowercase
 * - Sin acentos
 * - Sin caracteres especiales
 * - Sin espacios extras
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s]/g, '') // Solo letras, números y espacios
    .replace(/\s+/g, ' ') // Espacios múltiples → uno solo
    .trim();
}

/**
 * Genera una clave única para un evento (título + fecha)
 */
function generateEventKey(title: string, date: string): string {
  const normalizedTitle = normalizeTitle(title);
  return `${normalizedTitle}|${date}`;
}

/**
 * Calcula similitud entre dos títulos (0-1)
 * Usa algoritmo de Levenshtein simplificado
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeTitle(str1);
  const s2 = normalizeTitle(str2);

  if (s1 === s2) return 1.0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  // Contar palabras en común
  const words1 = new Set(s1.split(' '));
  const words2 = new Set(s2.split(' '));
  const intersection = new Set([...words1].filter(x => words2.has(x)));

  return intersection.size / Math.max(words1.size, words2.size);
}

/**
 * Deduplica eventos comparando con eventos existentes en pending_events
 */
export async function deduplicateEvents(events: any[], sourceId?: string): Promise<any[]> {
  if (events.length === 0) return [];

  const supabase = getSupabase();

  try {
    // Obtener eventos existentes de esta fuente (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: existing, error } = await supabase
      .from('pending_events')
      .select('title, event_date')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('Error al obtener eventos existentes:', error);
      return events; // En caso de error, retornar todos
    }

    // Crear set de eventos existentes
    const existingSet = new Set(
      existing?.map(e => generateEventKey(e.title, e.event_date)) || []
    );

    // Filtrar eventos que ya existen
    const uniqueEvents = events.filter(event => {
      const key = generateEventKey(event.title, event.event_date);

      // Si existe exactamente igual, descartar
      if (existingSet.has(key)) {
        return false;
      }

      // Verificar similitud con eventos existentes de la misma fecha
      const sameDate = existing?.filter(e => e.event_date === event.event_date) || [];

      for (const existing of sameDate) {
        const similarity = calculateSimilarity(event.title, existing.title);
        if (similarity > 0.85) { // 85% similar → considerar duplicado
          return false;
        }
      }

      // Agregar al set para evitar duplicados dentro del mismo batch
      existingSet.add(key);
      return true;
    });

    const filtered = events.length - uniqueEvents.length;
    if (filtered > 0) {
      console.log(`[Deduplication] Filtrados ${filtered} duplicados de ${events.length} eventos`);
    }

    return uniqueEvents;

  } catch (error) {
    console.error('Error en deduplicación:', error);
    return events; // En caso de error, retornar todos
  }
}

/**
 * Deduplica eventos dentro del mismo array (sin consultar DB)
 */
export function deduplicateLocalEvents(events: any[]): any[] {
  const seen = new Set<string>();

  return events.filter(event => {
    const key = generateEventKey(event.title, event.event_date);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
