'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface UserPreferences {
    theme: 'dark' | 'light';
    language: 'es' | 'en';
    notifications_enabled: boolean;
    favorite_categories: string[];
    location_radius_km: number;
}

const DEFAULT_PREFERENCES: UserPreferences = {
    theme: 'dark',
    language: 'es',
    notifications_enabled: true,
    favorite_categories: [],
    location_radius_km: 10,
};

interface PreferencesContextType {
    preferences: UserPreferences;
    updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => Promise<void>;
    resetPreferences: () => Promise<void>;
    loading: boolean;
    error: string | null;
}

const PreferencesContext = createContext<PreferencesContextType>({
    preferences: DEFAULT_PREFERENCES,
    updatePreference: async () => { },
    resetPreferences: async () => { },
    loading: true,
    error: null,
});

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
    const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id || null);
        }
        getUser();
    }, []);

    useEffect(() => {
        async function loadPreferences() {
            // Cargar del localStorage primero
            const stored = localStorage.getItem('venuz_preferences');
            if (stored) {
                try {
                    setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) });
                } catch (e) { }
            }

            if (!userId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const { data, error: fetchError } = await supabase
                    .from('user_preferences')
                    .select('*')
                    .eq('user_id', userId)
                    .single();

                if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

                if (data) {
                    const prefs: UserPreferences = {
                        theme: data.theme,
                        language: data.language,
                        notifications_enabled: data.notifications_enabled,
                        favorite_categories: data.favorite_categories || [],
                        location_radius_km: data.location_radius_km,
                    };
                    setPreferences(prefs);
                    localStorage.setItem('venuz_preferences', JSON.stringify(prefs));
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadPreferences();
    }, [userId]);

    useEffect(() => {
        if (preferences.theme === 'light') {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
        } else {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        }
    }, [preferences.theme]);

    const updatePreference = useCallback(async <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
        const newPreferences = { ...preferences, [key]: value };
        setPreferences(newPreferences);
        localStorage.setItem('venuz_preferences', JSON.stringify(newPreferences));

        if (!userId) return;

        try {
            await supabase.from('user_preferences').upsert({ user_id: userId, [key]: value }, { onConflict: 'user_id' });
        } catch (err: any) {
            setError(err.message);
            setPreferences(preferences);
        }
    }, [preferences, userId]);

    const resetPreferences = useCallback(async () => {
        setPreferences(DEFAULT_PREFERENCES);
        localStorage.setItem('venuz_preferences', JSON.stringify(DEFAULT_PREFERENCES));

        if (!userId) return;

        try {
            await supabase.from('user_preferences').update(DEFAULT_PREFERENCES).eq('user_id', userId);
        } catch (err: any) {
            setError(err.message);
        }
    }, [userId]);

    return (
        <PreferencesContext.Provider value={{ preferences, updatePreference, resetPreferences, loading, error }}>
            {children}
        </PreferencesContext.Provider>
    );
}

export function usePreferences() {
    return useContext(PreferencesContext);
}
