'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface UseFavoritesReturn {
    favorites: Set<string>;
    addFavorite: (contentId: string) => Promise<void>;
    removeFavorite: (contentId: string) => Promise<void>;
    toggleFavorite: (contentId: string) => Promise<void>;
    isFavorite: (contentId: string) => boolean;
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
            return;
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
        }
    }, [userId]);

    // Toggle favorito
    const toggleFavorite = useCallback(async (contentId: string) => {
        if (!userId) {
            setError('Debes iniciar sesión para guardar favoritos');
            return;
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

            // Sincronizar con el estado real del servidor
            if (data?.is_favorite !== !wasFavorite) {
                setFavorites(prev => {
                    const newSet = new Set(prev);
                    if (data?.is_favorite) {
                        newSet.add(contentId);
                    } else {
                        newSet.delete(contentId);
                    }
                    return newSet;
                });
            }
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
        }
    }, [userId, favorites]);

    // Verificar si es favorito
    const isFavorite = useCallback((contentId: string): boolean => {
        return favorites.has(contentId);
    }, [favorites]);

    return {
        favorites,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
        loading,
        error,
    };
}
