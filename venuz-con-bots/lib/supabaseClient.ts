import { createClient } from '@supabase/supabase-js';

// ☢️ FIX NUCLEAR: URL Hardcodeada para bypass de Env Vars corruptas
// TODO: Revertir a process.env una vez que Vercel limpie la caché
const supabaseUrl = 'https://jbrmziwosyeructvlvrq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impicm16aXdvc3llcnVjdHZsdnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5Njg4NDEsImV4cCI6MjA4MjU0NDg0MX0.PCZABM-pfQ6XH2qchLqWH9s-O1J6rGnWqySnx1InsmY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


