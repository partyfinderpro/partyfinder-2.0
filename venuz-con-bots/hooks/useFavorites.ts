'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface UseFavoritesReturn {
    favorites: Set<string>;
    addFavorite: (contentId: string) => Promise<void>;
    removeFavorite: (contentId: string) => Promise<void>;
    toggleFavorite: (contentId: string) => Promise<boolean>;
    isFavorite: (contentId: string) => boolean;
    getFavoriteCount: (contentId: string) => Promise<number>;
    loading: boolean;
    error: string | null;
}

export function useFavorites(): UseFavoritesReturn {
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    // Obtener usuario actual
    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id || null);
        }
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUserId(session?.user?.id || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Cargar favoritos del usuario
    useEffect(() => {
        async function loadFavorites() {
            if (!userId) {
                setFavorites(new Set());
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const { data, error: fetchError } = await supabase
                    .from('favorites')
                    .select('content_id')
                    .eq('user_id', userId);

                if (fetchError) throw fetchError;

                const favoriteIds = new Set(data?.map(f => f.content_id) || []);
                setFavorites(favoriteIds);
            } catch (err: any) {
                console.error('Error cargando favoritos:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadFavorites();
    }, [userId]);

    // Agregar favorito
    const addFavorite = useCallback(async (contentId: string) => {
        if (!userId) {
            setError('Debes iniciar sesión para guardar favoritos');
            throw new Error('Not authenticated');
        }

        // Optimistic update
        setFavorites(prev => new Set(prev).add(contentId));

        try {
            const { error: insertError } = await supabase
                .from('favorites')
                .insert({
                    user_id: userId,
                    content_id: contentId,
                });

            if (insertError) throw insertError;
        } catch (err: any) {
            console.error('Error agregando favorito:', err);
            setFavorites(prev => {
                const newSet = new Set(prev);
                newSet.delete(contentId);
                return newSet;
            });
            setError(err.message);
            throw err;
        }
    }, [userId]);

    // Quitar favorito
    const removeFavorite = useCallback(async (contentId: string) => {
        if (!userId) return;

        setFavorites(prev => {
            const newSet = new Set(prev);
            newSet.delete(contentId);
            return newSet;
        });

        try {
            const { error: deleteError } = await supabase
                .from('favorites')
                .delete()
                .eq('user_id', userId)
                .eq('content_id', contentId);

            if (deleteError) throw deleteError;
        } catch (err: any) {
            console.error('Error quitando favorito:', err);
            setFavorites(prev => new Set(prev).add(contentId));
            setError(err.message);
            throw err;
        }
    }, [userId]);

    // Toggle favorito
    const toggleFavorite = useCallback(async (contentId: string): Promise<boolean> => {
        if (!userId) {
            setError('Debes iniciar sesión para guardar favoritos');
            throw new Error('Not authenticated');
        }

        const wasFavorite = favorites.has(contentId);

        // Optimistic update
        setFavorites(prev => {
            const newSet = new Set(prev);
            if (wasFavorite) {
                newSet.delete(contentId);
            } else {
                newSet.add(contentId);
            }
            return newSet;
        });

        try {
            const { data, error: rpcError } = await supabase
                .rpc('toggle_favorite', {
                    p_content_id: contentId
                });

            if (rpcError) throw rpcError;

            return data?.is_favorite ?? !wasFavorite;
        } catch (err: any) {
            console.error('Error en toggle favorito:', err);
            // Revertir optimistic update
            setFavorites(prev => {
                const newSet = new Set(prev);
                if (wasFavorite) {
                    newSet.add(contentId);
                } else {
                    newSet.delete(contentId);
                }
                return newSet;
            });
            setError(err.message);
            throw err;
        }
    }, [userId, favorites]);

    // Verificar si es favorito
    const isFavorite = useCallback((contentId: string): boolean => {
        return favorites.has(contentId);
    }, [favorites]);

    // Obtener contador de favoritos
    const getFavoriteCount = useCallback(async (contentId: string): Promise<number> => {
        try {
            const { count, error } = await supabase
                .from('favorites')
                .select('*', { count: 'exact', head: true })
                .eq('content_id', contentId);

            if (error) throw error;
            return count || 0;
        } catch (err) {
            console.error('Error obteniendo contador:', err);
            return 0;
        }
    }, []);

    return {
        favorites,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
        getFavoriteCount,
        loading,
        error,
    };
}
