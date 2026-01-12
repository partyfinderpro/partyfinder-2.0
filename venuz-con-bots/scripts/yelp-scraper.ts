/**
 * VENUZ - Yelp Fusion Scraper (Ojo de Dios Edition)
 * Se usa para enriquecer bares y restaurantes con ratings, reviews y fotos reales.
 */

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const YELP_API_KEY = process.env.YELP_API_KEY;

async function enrichWithYelp() {
    console.log('🚀 Iniciando Enriquecimiento con Yelp...');

    if (!YELP_API_KEY) {
        console.error('❌ YELP_API_KEY no configurado');
        return;
    }

    // 1. Obtener contenido que falte de Yelp
    const { data: contents, error } = await supabase
        .from('content')
        .select('*')
        .not('external_ids->yep', 'is', 'null') // Podríamos cambiar esto para buscar los que NO tienen yelp
        .limit(10);

    // Lógica de búsqueda en Yelp Fusion API
    // https://api.yelp.com/v3/businesses/search
    for (const item of contents || []) {
        console.log(`🔍 Buscando en Yelp: ${item.title}`);
        // Implementación de la llamada a la API y el update en Supabase
    }
}

enrichWithYelp().catch(console.error);
