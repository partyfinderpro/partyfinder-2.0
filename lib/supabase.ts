// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// FALLBACK DEFINITIVO - Inyectado directamente para asegurar conexión en Producción
const SUPABASE_URL = 'https://jbrmziwosyeructvlvrq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impicm16aXdvc3llcnVjdHZsdnJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njk2ODg0MSwiZXhwIjoyMDgyNTQ0ODQxfQ.O20L2R8qZmZ9Cm41rs4FVNCpROQXC9oLO731DlHMZkA';

if (typeof window !== 'undefined') {
    console.log('[VENUZ] Conexión directa a Supabase activada.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
