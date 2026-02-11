// lib/scraper/utils/keywords.ts
// Sistema de keywords para clasificación de eventos

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface KeywordMatch {
  matched: string[];
  priority: number;
}

/**
 * Keywords por prioridad para PartyFinder
 */
const KEYWORDS_BY_PRIORITY = {
  1: [ // MUY ALTA - Lo que PartyFinder busca
    'feria patronal', 'carnaval', 'palenque', 'charreada', 
    'concierto masivo', 'jaripeo', 'rodeo', 'festival música'
  ],
  2: [ // ALTA
    'fiesta pueblo', 'vaquería', 'morisma', 'romería', 
    'procesión', 'peregrinación', 'feria regional', 'kermés'
  ],
  3: [ // MEDIA
    'concierto', 'festival', 'evento cultural', 'celebración',
    'baile popular', 'verbena', 'serenata'
  ],
  4: [ // BAJA - Filtrar
    'exposición', 'conferencia', 'taller', 'curso',
    'museo', 'biblioteca', 'lectura', 'seminario'
  ]
};

/**
 * Obtiene el mapa de keywords desde Supabase (con cache)
 */
let keywordsCache: Map<string, any> | null = null;
let cacheTime = 0;
const CACHE_TTL = 3600000; // 1 hora

export async function getKeywordsMap(): Promise<Map<string, any>> {
  const now = Date.now();
  
  // Usar cache si es reciente
  if (keywordsCache && (now - cacheTime) < CACHE_TTL) {
    return keywordsCache;
  }

  try {
    const { data, error } = await supabase
      .from('keywords')
      .select('*');

    if (error) throw error;

    keywordsCache = new Map(
      data?.map(k => [k.keyword.toLowerCase(), k]) || []
    );
    cacheTime = now;

    return keywordsCache;
  } catch (error) {
    console.error('Error obteniendo keywords, usando fallback:', error);
    // Fallback: crear mapa desde constantes
    return createFallbackKeywordsMap();
  }
}

/**
 * Crea un mapa de keywords desde las constantes (fallback)
 */
function createFallbackKeywordsMap(): Map<string, any> {
  const map = new Map();
  
  Object.entries(KEYWORDS_BY_PRIORITY).forEach(([priority, keywords]) => {
    keywords.forEach(keyword => {
      map.set(keyword.toLowerCase(), {
        keyword,
        priority: parseInt(priority),
        category: priority === '1' || priority === '2' ? 'fiesta' : 'evento'
      });
    });
  });

  return map;
}

/**
 * Busca keywords en un texto y retorna matches + prioridad
 */
export function matchKeywords(text: string, keywordsMap: Map<string, any>): KeywordMatch {
  const matched: string[] = [];
  let lowestPriority = 5;

  const lowerText = text.toLowerCase();

  for (const [keyword, data] of keywordsMap.entries()) {
    if (lowerText.includes(keyword)) {
      matched.push(keyword);
      if (data.priority < lowestPriority) {
        lowestPriority = data.priority;
      }
    }
  }

  return {
    matched,
    priority: matched.length > 0 ? lowestPriority : 3 // default: media
  };
}

/**
 * Filtra eventos por prioridad (retorna true si debe incluirse)
 */
export function shouldIncludeEvent(priority: number, hasKeywords: boolean): boolean {
  // Incluir si:
  // - Tiene keywords de alta prioridad (1-2)
  // - Tiene keywords de media prioridad (3)
  // - NO incluir si es baja prioridad (4+) sin keywords
  
  if (priority <= 2) return true; // Siempre incluir alta prioridad
  if (priority === 3 && hasKeywords) return true; // Media con keywords
  if (priority >= 4) return false; // Descartar baja prioridad
  
  return hasKeywords; // Default: incluir si tiene alguna keyword
}
