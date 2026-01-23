// hooks/useInteractions.ts
// Sistema de likes persistente con optimistic updates
// Código basado en análisis de Grok

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UseInteractionsProps {
    contentId: string;
    userId?: string | null;
    initialLikes?: number;
}

export function useInteractions({ contentId, userId, initialLikes = 0 }: UseInteractionsProps) {
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(initialLikes);
    const [loading, setLoading] = useState(false);
    const [lastInteraction, setLastInteraction] = useState<number>(0);

    // Rate limiting: máximo 1 like cada 2 segundos
    const RATE_LIMIT_MS = 2000;

    // Cargar estado inicial de like
    const loadLikeStatus = useCallback(async () => {
        if (!userId) return;

        try {
            const { data } = await supabase
                .from('interactions')
                .select('id')
                .eq('user_id', userId)
                .eq('content_id', contentId)
                .eq('type', 'like')
                .single();

            setLiked(!!data);
        } catch (error) {
            // No hay like existente
            setLiked(false);
        }
    }, [userId, contentId]);

    // Toggle like con optimistic update y rate limiting
    const toggleLike = useCallback(async () => {
        // Rate limiting check
        const now = Date.now();
        if (now - lastInteraction < RATE_LIMIT_MS) {
            console.log('[VENUZ] Rate limited - espera antes de hacer like de nuevo');
            return;
        }
        setLastInteraction(now);

        if (loading) return;
        setLoading(true);

        // Optimistic update
        const newLiked = !liked;
        setLiked(newLiked);
        setLikesCount(prev => newLiked ? prev + 1 : prev - 1);

        try {
            if (userId) {
                // Usuario autenticado - guardar en DB
                const { data: existing } = await supabase
                    .from('interactions')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('content_id', contentId)
                    .eq('type', 'like')
                    .single();

                if (existing) {
                    // Quitar like
                    await supabase.from('interactions').delete().eq('id', existing.id);
                } else {
                    // Añadir like
                    await supabase.from('interactions').insert({
                        user_id: userId,
                        content_id: contentId,
                        type: 'like',
                        created_at: new Date().toISOString()
                    });
                }

                // Actualizar contador en content
                const { error: updateError } = await supabase
                    .from('content')
                    .update({
                        likes: newLiked ? likesCount + 1 : Math.max(0, likesCount - 1)
                    })
                    .eq('id', contentId);

                if (updateError) {
                    console.error('[VENUZ] Error updating likes count:', updateError);
                }
            } else {
                // Usuario anónimo - guardar en localStorage
                const localLikes = JSON.parse(localStorage.getItem('venuz_likes') || '{}');
                if (newLiked) {
                    localLikes[contentId] = true;
                } else {
                    delete localLikes[contentId];
                }
                localStorage.setItem('venuz_likes', JSON.stringify(localLikes));
            }
        } catch (error) {
            // Revertir optimistic update on error
            setLiked(!newLiked);
            setLikesCount(prev => newLiked ? prev - 1 : prev + 1);
            console.error('[VENUZ] Error toggling like:', error);
        } finally {
            setLoading(false);
        }
    }, [userId, contentId, liked, likesCount, loading, lastInteraction]);

    // Registrar view
    const registerView = useCallback(async () => {
        try {
            await supabase
                .from('content')
                .update({ views: likesCount + 1 })
                .eq('id', contentId);

            // También insertar en interactions para analytics
            if (userId) {
                await supabase.from('interactions').insert({
                    user_id: userId,
                    content_id: contentId,
                    type: 'view',
                    created_at: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('[VENUZ] Error registering view:', error);
        }
    }, [contentId, userId, likesCount]);

    // Cargar likes de localStorage para usuarios anónimos
    useEffect(() => {
        if (!userId) {
            const localLikes = JSON.parse(localStorage.getItem('venuz_likes') || '{}');
            setLiked(!!localLikes[contentId]);
        } else {
            loadLikeStatus();
        }
    }, [userId, contentId, loadLikeStatus]);

    return {
        liked,
        likesCount,
        toggleLike,
        loadLikeStatus,
        registerView,
        loading
    };
}

// Hook para obtener stats de un contenido
export function useContentStats(contentId: string) {
    const [stats, setStats] = useState({ views: 0, likes: 0, shares: 0 });

    useEffect(() => {
        async function fetchStats() {
            const { data } = await supabase
                .from('content')
                .select('views, likes')
                .eq('id', contentId)
                .single();

            if (data) {
                setStats({
                    views: data.views || 0,
                    likes: data.likes || 0,
                    shares: 0
                });
            }
        }

        fetchStats();
    }, [contentId]);

    return stats;
}
