// lib/scraper/mazatlan-scraper.ts
// Scraper especializado para https://tics.mazatlan.gob.mx/tourist/es/eventos

import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { parseDateSpanish } from './utils/date-parser';
import { matchKeywords, getKeywordsMap } from './utils/keywords';
import { deduplicateEvents } from './utils/deduplication';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * Scraper especializado para Mazatlán
 * URL verificada: https://tics.mazatlan.gob.mx/tourist/es/eventos
 */
export async function scrapeMazatlan(source: any) {
  console.log(`[Mazatlán Scraper] → ${source.url}`);

  try {
    const { data: html } = await axios.get(source.url, {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(html);
    const events: any[] = [];
    const keywordsMap = await getKeywordsMap();

    // Selectores específicos verificados para Mazatlán
    $('img[src*="/tourist/es/eventos/"]').each((_, img) => {
      const $container = $(img).closest('div, article, section').parent();

      const title = $container.find('h3, h2, h4, strong').first().text().trim();
      if (!title || title.length < 8) return;

      // Formato específico de Mazatlán: "12 febrero, 2026 - 02:00 pm"
      const dateText = $container.text().match(/(\d{1,2}\s+\w+,?\s+\d{4}\s*-?\s*\d{1,2}:\d{2}\s*(?:am|pm)?)/i)?.[0] || '';
      
      const parsed = parseDateSpanish(dateText);
      if (!parsed) return;

      const description = $container
        .find('p')
        .filter((_, p) => $(p).text().length > 40)
        .first()
        .text()
        .trim();

      const fullText = `${title} ${description}`.toLowerCase();
      const { matched, priority } = matchKeywords(fullText, keywordsMap);

      events.push({
        source_id: source.id,
        title: title.trim(),
        description: description || null,
        event_date: parsed.date,
        event_time: parsed.time || null,
        location_name: 'Mazatlán, Sinaloa',
        location_state: 'Sinaloa',
        location_municipality: 'Mazatlán',
        matched_keywords: matched,
        priority,
        status: 'pending',
        raw_data: {
          url: source.url,
          scraper_type: 'mazatlan',
          scraped_at: new Date().toISOString(),
        },
      });
    });

    // Deduplicar
    const uniqueEvents = await deduplicateEvents(events, source.id);

    // Insertar
    if (uniqueEvents.length > 0) {
      const { error } = await supabase
        .from('pending_events')
        .insert(uniqueEvents);

      if (error) {
        console.error('[Mazatlán] Error al insertar:', error.message);
      } else {
        console.log(`[Mazatlán] ✅ ${uniqueEvents.length} eventos insertados`);
      }
    }

    return uniqueEvents;

  } catch (error: any) {
    console.error('[Mazatlán] ❌ Error:', error.message);
    throw error;
  }
}
