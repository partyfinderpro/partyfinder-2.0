/**
 * VENUZ - Reddit Scraper (Safety & Culture)
 * Scraping de r/puertovallarta para encontrar "Tips de Seguridad" y "Recomendaciones Locales".
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function scrapeReddit() {
    console.log('🚀 Iniciando Reddit Scraper (r/puertovallarta)...');

    // Usaremos una búsqueda de threads recientes con palabras clave:
    // "safe", "scam", "best beach", "hidden gem", "cheap eats"

    const keywords = ['safe', 'scam', 'best', 'tourist trap', 'prices'];

    for (const word of keywords) {
        const url = `https://www.reddit.com/r/puertovallarta/search.json?q=${word}&sort=relevance&t=month`;
        console.log(`📡 Buscando Reddit: ${word}...`);

        // Lógica de fetch y filtrado de contenido relevante
        // El contenido se guardará en la tabla 'content' con categoría 'tips' o 'seguridad'
    }
}

scrapeReddit().catch(console.error);
