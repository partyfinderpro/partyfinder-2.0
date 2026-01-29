// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// FALLBACK DEFINITIVO - Inyectado directamente para asegurar conexión en Producción
const SUPABASE_URL = 'https://jbrmziwosyeructvlvrq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_emVwFBH19Vn54SrEegsWxg_WKU9MaHR';

if (typeof window !== 'undefined') {
    console.log('[VENUZ] Conexión directa a Supabase activada.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
