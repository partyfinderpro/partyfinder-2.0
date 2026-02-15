// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[VENUZ] ⚠️ Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables (Build time warning)');
}

// Create a safe client even if keys are missing (to avoid build crash)
// Use dummy values if missing, requests will fail at runtime but build will pass
export const supabase = createClient(
    SUPABASE_URL || 'https://placeholder.supabase.co',
    SUPABASE_ANON_KEY || 'placeholder'
);
