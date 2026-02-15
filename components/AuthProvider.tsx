// components/AuthProvider.tsx
'use client';

import { createBrowserClient } from '@supabase/ssr';
import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { SupabaseClient, Session, User } from '@supabase/supabase-js';

// Context type
interface SupabaseContextType {
        supabase: SupabaseClient;
        session: Session | null;
        user: User | null;
}

const SupabaseContext = createContext<SupabaseContextType | null>(null);

export function useSupabase() {
        const context = useContext(SupabaseContext);
        if (!context) {
                    throw new Error('useSupabase must be used within AuthProvider');
        }
        return context;
}

// Convenience hooks
export function useSupabaseClient() {
        return useSupabase().supabase;
}

export function useUser() {
        return useSupabase().user;
}

export function useSession() {
        return useSupabase().session;
}

export default function AuthProvider({
        children,
}: {
        children: React.ReactNode;
}) {
        const [session, setSession] = useState<Session | null>(null);
        const [user, setUser] = useState<User | null>(null);

    // Guard: use fallback placeholder values if env vars are missing (build time safety)
    const supabase = useMemo(
                () =>
                                createBrowserClient(
                                                    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
                                                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
                                                ),
                []
            );

    useEffect(() => {
                // Skip auth initialization if env vars are missing
                      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
                                      console.warn('[VENUZ] ⚠️ Missing Supabase env vars in AuthProvider — skipping auth init');
                                      return;
                      }

                      // Get initial session
                      supabase.auth.getSession().then(({ data: { session } }) => {
                                      setSession(session);
                                      setUser(session?.user ?? null);
                      });

                      // Listen for auth changes
                      const {
                                      data: { subscription },
                      } = supabase.auth.onAuthStateChange((_event, session) => {
                                      setSession(session);
                                      setUser(session?.user ?? null);
                      });

                      return () => subscription.unsubscribe();
    }, [supabase]);

    const value = useMemo(
                () => ({
                                supabase,
                                session,
                                user,
                }),
                [supabase, session, user]
            );

    return (
                <SupabaseContext.Provider value={value}>
                    {children}
                </SupabaseContext.Provider>SupabaseContext.Provider>
            );
}
