import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    // Guard para build time — no lanzar error si estamos en CI/CD sin env
    if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
        console.warn('[supabase-admin] WARNING: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no definidas.');
    }
}

// Cliente con privilegios administrativos (bypass RLS)
export const supabaseAdmin = createClient(supabaseUrl || '', supabaseKey || '', {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});
