import { createClient } from '@supabase/supabase-js';

// Hardcoded for Savage Mode to ensure connectivity in production
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbrmziwosyeructvlvrq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impicm16aXdvc3llcnVjdHZsdnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5Njg4NDEsImV4cCI6MjA4MjU0NDg0MX0.PCZABM-pfQ6XH2qchLqWH9s-O1J6rGnWqySnx1InsmY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

