// lib/scraper/gobierno-scraper.ts
// Versión Grok v4.0 - Ultra robusta y adaptable

import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { parseDateSpanish, isValidEventDate } from './utils/date-parser';
import { matchKeywords, getKeywordsMap, shouldIncludeEvent } from './utils/keywords';
import { deduplicateEvents, deduplicateLocalEvents } from './utils/deduplication';

const getSupabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  }

  return createClient(url, key);
};

const CONFIG = {
  timeout: 25000,
  maxRetries: 4,
  baseRetryDelay: 4000,
  rateLimitMs: 3200,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  maxEventsPerSource: 150,
};

interface ScrapedEvent {
  source_id: string;
  title: string;
  description?: string | null;
  event_date: string;
  event_time?: string | null;
  location_name?: string | null;
  location_state: string;
  location_municipality?: string | null;
  matched_keywords: string[];
  priority: number;
  raw_data: any;
  status?: string;
}

/**
 * Scraper Gobierno v4.0 - Inteligente y adaptable
 */
export async function scrapeGobierno(source: any): Promise<ScrapedEvent[]> {
  const startTime = Date.now();
  console.log(`[Gobierno v4.0] → ${source.name}`);

  let html = '';

  // === FASE 1: Descarga con retries exponenciales ===
  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        await new Promise(r => setTimeout(r, (attempt - 1) * CONFIG.baseRetryDelay));
      }

      const response = await axios.get(source.url, {
        timeout: CONFIG.timeout,
        headers: { 'User-Agent': CONFIG.userAgent },
        maxRedirects: 8,
      });

      if (response.status === 200) {
        html = response.data;
        break;
      }
    } catch (err: any) {
      console.warn(`[Gobierno] Intento ${attempt}/${CONFIG.maxRetries} falló`);
      if (attempt === CONFIG.maxRetries) {
        throw new Error(`Falló después de ${CONFIG.maxRetries} intentos: ${err.message}`);
      }
    }
  }

  if (!html) return [];

  const $ = cheerio.load(html);
  const keywordsMap = await getKeywordsMap();

  // === FASE 2: Estrategias inteligentes con ranking ===
  const strategies = [
    { score: 10, selector: 'article.evento, .card-evento, .evento-item, .agenda-card' },
    { score: 8, selector: '.evento, .event, .card, .item-evento, .agenda-item' },
    { score: 6, selector: 'div[class*="evento"], div[class*="event"], section.eventos' },
    { score: 4, selector: 'li, .post, .noticia, .entry' },
    { score: 2, selector: 'div, section, article' },
  ];

  let bestEvents: ScrapedEvent[] = [];
  let bestStrategyScore = 0;

  for (const strat of strategies) {
    const events: ScrapedEvent[] = [];

    $(strat.selector).each((index, elem) => {
      if (events.length >= CONFIG.maxEventsPerSource) return false; // Break

      const $elem = $(elem);

      // Extraer información
      const title = extractBestTitle($elem);
      if (!title || title.length < 8) return;

      const dateText = extractBestDate($elem);
      const parsed = parseDateSpanish(dateText);
      if (!parsed) return;
      if (!isValidEventDate(parsed.date)) return;

      const description = extractBestDescription($elem, $);
      const location = extractBestLocation($elem) || source.municipality || source.state;

      // Matching de keywords
      const fullText = `${title} ${description} ${location}`.toLowerCase();
      const { matched, priority } = matchKeywords(fullText, keywordsMap);

      // Filtro inteligente
      if (!shouldIncludeEvent(priority, matched.length > 0)) return;

      events.push({
        source_id: source.id,
        title: title.trim(),
        description: description?.trim() || null,
        event_date: parsed.date,
        event_time: parsed.time || null,
        location_name: location.trim(),
        location_state: source.state,
        location_municipality: source.municipality || null,
        matched_keywords: matched,
        priority,
        status: 'pending',
        raw_data: {
          url: source.url,
          strategy_score: strat.score,
          scraped_at: new Date().toISOString(),
        },
      });
    });

    // Usar la estrategia que encontró más eventos
    if (events.length > bestEvents.length) {
      bestEvents = events;
      bestStrategyScore = strat.score;
    }

    // Optimización: si ya encontró suficientes, no seguir probando
    if (bestEvents.length >= 10) break;
  }

  // === FASE 3: Deduplicación local + base de datos ===
  let uniqueEvents = deduplicateLocalEvents(bestEvents);
  uniqueEvents = await deduplicateEvents(uniqueEvents, source.id);

  const supabase = getSupabase();

  // === FASE 4: Insertar en pending_events ===
  if (uniqueEvents.length > 0) {
    const { error } = await supabase
      .from('pending_events')
      .insert(uniqueEvents);

    if (error) {
      console.error('[Gobierno v4.0] Error al insertar:', error.message);
    } else {
      console.log(`[Gobierno v4.0] ✅ ${uniqueEvents.length} eventos insertados`);
    }
  } else {
    console.log('[Gobierno v4.0] ⚠️  0 eventos nuevos encontrados');
  }

  // === FASE 5: Guardar metadata de éxito ===
  if (bestEvents.length > 0) {
    await supabase
      .from('sce_sources')
      .update({
        metadata: {
          ...source.metadata,
          last_success_strategy_score: bestStrategyScore,
          last_success_count: uniqueEvents.length,
          last_success_at: new Date().toISOString(),
        },
      })
      .eq('id', source.id);
  }

  const duration = Date.now() - startTime;
  console.log(`[Gobierno v4.0] Completado en ${duration}ms`);

  return uniqueEvents;
}

// === Funciones auxiliares robustas ===

function extractBestTitle($elem: cheerio.Cheerio<any>): string {
  const candidates = [
    $elem.find('h1, h2, h3, h4, .title, .titulo, .nombre, .event-title').first().text().trim(),
    $elem.find('strong, b').first().text().trim(),
    $elem.find('a').first().text().trim(),
    $elem.text().split('\n')[0]?.trim() || '',
  ];

  return candidates.find(t => t.length >= 8 && t.length <= 200) || '';
}

function extractBestDate($elem: cheerio.Cheerio<any>): string {
  const candidates = [
    $elem.find('time, .fecha, .date, .dia, span[class*="date"]').first().text().trim(),
    $elem.find('[datetime]').attr('datetime') || '',
    $elem.text().match(/\d{1,2}\s+(?:de\s+)?[a-z]+\s+(?:de\s+)?\d{4}/i)?.[0] || '',
    $elem.text().match(/\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/)?.[0] || '',
  ];

  return candidates.find(t => t && t.length > 0) || '';
}

function extractBestDescription($elem: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): string {
  return $elem
    .find('p, .description, .desc, .info, .contenido, .resumen')
    .filter((_, p) => $(p).text().length > 40)
    .first()
    .text()
    .trim()
    .substring(0, 500) || '';
}

function extractBestLocation($elem: cheerio.Cheerio<any>): string {
  return $elem
    .find('.lugar, .location, .venue, .direccion, .lugar-evento, .sitio')
    .first()
    .text()
    .trim() || '';
}
