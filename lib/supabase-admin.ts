import { createClient } from '@supabase/supabase-js';

// Usar variables de entorno para Service Role (Solo servidor)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

// Cliente con privilegios administrativos (bypass RLS)
// Seguro para tiempo de build
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});
