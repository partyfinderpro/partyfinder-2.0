// hooks/useInteractions.ts
// Sistema de interacciones persistente (Likes, Views, Shares) con optimistic updates
// Soporta usuarios autenticados y anónimos (vía venuz_user_id en localStorage)

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UseInteractionsProps {
    contentId: string;
    userId?: string | null;
    initialLikes?: number;
    initialViews?: number;
    initialShares?: number;
}

export function useInteractions({
    contentId,
    userId: providedUserId,
    initialLikes = 0,
    initialViews = 0,
    initialShares = 0
}: UseInteractionsProps) {
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(initialLikes);
    const [disliked, setDisliked] = useState(false);
    const [viewsCount, setViewsCount] = useState(initialViews);
    const [sharesCount, setSharesCount] = useState(initialShares);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(providedUserId || null);

    // Rate limiting: máximo 1 interacción cada segundo
    const RATE_LIMIT_MS = 1000;
    const [lastInteraction, setLastInteraction] = useState<number>(0);

    // Obtener UserId de localStorage si no viene de props (Usuario Anónimo)
    useEffect(() => {
        if (!userId && typeof window !== 'undefined') {
            const localId = localStorage.getItem('venuz_user_id');
            if (localId) setUserId(localId);
        }
    }, [userId]);

    // Cargar estado inicial de like (solo si hay userId)
    const loadLikeStatus = useCallback(async (currentUserId: string) => {
        try {
            const { data } = await supabase
                .from('interactions')
                .select('id')
                .eq('user_id', currentUserId)
                .eq('content_id', contentId)
                .eq('action', 'like')
                .maybeSingle();

            if (data) setLiked(true);
        } catch (error) {
            console.error('[VENUZ] Error loading like status:', error);
        }
    }, [contentId]);

    // Cargar estado inicial de DISLIKE
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const localDislikes = JSON.parse(localStorage.getItem('venuz_dislikes') || '{}');
            if (localDislikes[contentId]) setDisliked(true);
        }
    }, [contentId]);

    // Toggle LIKE
    const toggleLike = useCallback(async () => {
        if (!contentId || loading) return;

        const now = Date.now();
        if (now - lastInteraction < RATE_LIMIT_MS) return;
        setLastInteraction(now);
        setLoading(true);

        // Optimistic update
        const newLiked = !liked;
        const previousLiked = liked;
        setLiked(newLiked);
        setLikesCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));

        try {
            const effectiveUserId = userId || localStorage.getItem('venuz_user_id') || 'anon';

            if (newLiked) {
                // Añadir Like
                await supabase.from('interactions').insert({
                    user_id: effectiveUserId,
                    content_id: contentId,
                    action: 'like'
                });

                // Actualizar contador global
                try {
                    await supabase.rpc('increment_likes', { row_id: contentId });
                } catch (e) { console.warn('RPC increment_likes missing'); }
            } else {
                // Quitar Like
                await supabase.from('interactions')
                    .delete()
                    .eq('user_id', effectiveUserId)
                    .eq('content_id', contentId)
                    .eq('action', 'like');

                try {
                    await supabase.rpc('decrement_likes', { row_id: contentId });
                } catch (e) { console.warn('RPC decrement_likes missing'); }
            }

            // Sincronizar localStorage para UI anónima offline
            const localLikes = JSON.parse(localStorage.getItem('venuz_likes') || '{}');
            if (newLiked) localLikes[contentId] = true;
            else delete localLikes[contentId];
            localStorage.setItem('venuz_likes', JSON.stringify(localLikes));

            // ✨ NUEVO: También sincronizar con venuz_favorites para el sistema de favoritos
            const localFavorites = JSON.parse(localStorage.getItem('venuz_favorites') || '[]') as string[];
            if (newLiked) {
                if (!localFavorites.includes(contentId)) {
                    localFavorites.push(contentId);
                }
            } else {
                const index = localFavorites.indexOf(contentId);
                if (index > -1) {
                    localFavorites.splice(index, 1);
                }
            }
            localStorage.setItem('venuz_favorites', JSON.stringify(localFavorites));

        } catch (error) {
            // Revertir en caso de error
            setLiked(previousLiked);
            setLikesCount(prev => previousLiked ? prev + 1 : Math.max(0, prev - 1));
            console.error('[VENUZ] Error toggling like:', error);
        } finally {
            setLoading(false);
        }
    }, [contentId, liked, userId, loading, lastInteraction]);

    // Toggle DISLIKE
    const toggleDislike = useCallback(async () => {
        if (!contentId || loading) return;

        const now = Date.now();
        if (now - lastInteraction < RATE_LIMIT_MS) return;
        setLastInteraction(now);
        setLoading(true);

        // Optimistic update
        const newDisliked = !disliked;
        setDisliked(newDisliked);

        try {
            const effectiveUserId = userId || localStorage.getItem('venuz_user_id') || 'anon';

            // Guardar en localStorage
            const localDislikes = JSON.parse(localStorage.getItem('venuz_dislikes') || '{}');
            if (newDisliked) {
                localDislikes[contentId] = true;
                // Si damos dislike, quitamos like si existía
                if (liked) {
                    setLiked(false);
                    setLikesCount(prev => Math.max(0, prev - 1));
                    const localLikes = JSON.parse(localStorage.getItem('venuz_likes') || '{}');
                    delete localLikes[contentId];
                    localStorage.setItem('venuz_likes', JSON.stringify(localLikes));
                }
            } else {
                delete localDislikes[contentId];
            }
            localStorage.setItem('venuz_dislikes', JSON.stringify(localDislikes));

            // Llamar RPC solo si es dislike activo (para entrenar algo)
            if (newDisliked) {
                await supabase.rpc('increment_dislikes', { p_content_id: contentId });
            }

        } catch (error) {
            console.error('[VENUZ] Error toggling dislike:', error);
            setDisliked(!newDisliked); // Revert
        } finally {
            setLoading(false);
        }
    }, [contentId, disliked, liked, userId, loading, lastInteraction]);

    // Registrar SHARE
    const registerShare = useCallback(async () => {
        if (!contentId) return;

        try {
            const effectiveUserId = userId || localStorage.getItem('venuz_user_id') || 'anon';

            // 1. Guardar log de interacción
            await supabase.from('interactions').insert({
                user_id: effectiveUserId,
                content_id: contentId,
                action: 'share'
            });

            // 2. Incrementar contador en DB
            try {
                await supabase.rpc('increment_shares', { row_id: contentId });
            } catch (e) { console.warn('RPC increment_shares missing'); }

            setSharesCount(prev => prev + 1);
        } catch (error) {
            console.error('[VENUZ] Error registering share:', error);
        }
    }, [contentId, userId]);

    // Registrar VIEW
    const registerView = useCallback(async () => {
        if (!contentId) return;

        try {
            const effectiveUserId = userId || localStorage.getItem('venuz_user_id') || 'anon';

            // Solo registrar vista si no se ha registrado en esta sesión (opcional)
            const sessionKey = `viewed_${contentId}`;
            if (sessionStorage.getItem(sessionKey)) return;

            // 1. Guardar log de interacción (vía tabla)
            await supabase.from('interactions').insert({
                user_id: effectiveUserId,
                content_id: contentId,
                action: 'view'
            });

            // Actualizar contador global vía RPC (Falla silenciosamente si no existe el RPC)
            try {
                await supabase.rpc('increment_views', { row_id: contentId });
            } catch (rpcErr) {
                console.warn('[VENUZ] RPC increment_views failed (ignore if not implemented):', rpcErr);
            }

            setViewsCount(prev => prev + 1);
            sessionStorage.setItem(sessionKey, 'true');
        } catch (error) {
            console.error('[VENUZ] Error registering view:', error);
        }
    }, [contentId, userId]);


    // Efecto Inicial
    useEffect(() => {
        if (!contentId) return;

        // Cargar estado de "Like" previo
        const localLikes = JSON.parse(localStorage.getItem('venuz_likes') || '{}');
        if (localLikes[contentId]) {
            setLiked(true);
        } else if (userId) {
            loadLikeStatus(userId);
        }
    }, [contentId, userId, loadLikeStatus]);

    return {
        liked,
        likesCount,
        viewsCount,
        sharesCount,
        toggleLike,
        toggleDislike,
        disliked,
        registerShare,
        registerView,
        loading
    };
}

// Hook simple para lectura de estadísticas
export function useContentStats(contentId: string) {
    const [stats, setStats] = useState({ views: 0, likes: 0, shares: 0 });

    useEffect(() => {
        if (!contentId) return;

        async function fetchStats() {
            const { data, error } = await supabase
                .from('content')
                .select('views, likes, shares')
                .eq('id', contentId)
                .maybeSingle();

            if (data && !error) {
                setStats({
                    views: data.views || 0,
                    likes: data.likes || 0,
                    shares: data.shares || 0
                });
            }
        }

        fetchStats();
    }, [contentId]);

    return stats;
}

