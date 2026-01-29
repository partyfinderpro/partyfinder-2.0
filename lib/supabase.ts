// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// FALLBACK DEFINITIVO - Inyectado directamente para asegurar conexión en Producción
const SUPABASE_URL = 'https://jbrmziwosyeructvlvrq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impicm16aXdvc3llcnVjdHZsdnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDI4MTAsImV4cCI6MjA4NTIxODgxMH0.l5N2-7x1A6mY-O6sVz6r5w-N_K1nS-D-G8mY-u9-S-0';

if (typeof window !== 'undefined') {
    console.log('[VENUZ] Conexión directa a Supabase activada.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
