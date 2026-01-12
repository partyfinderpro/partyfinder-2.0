import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useInteractions(contentId: string) {
    const [isLiked, setIsLiked] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [savesCount, setSavesCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Cargar estado inicial
    useEffect(() => {
        async function loadInteractions() {
            try {
                // Obtener estado del usuario actual (si está logueado)
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    const { data: likeState } = await supabase
                        .rpc('get_interaction_state', {
                            target_content_id: contentId,
                            interaction_type: 'like'
                        });

                    const { data: saveState } = await supabase
                        .rpc('get_interaction_state', {
                            target_content_id: contentId,
                            interaction_type: 'save'
                        });

                    setIsLiked(likeState || false);
                    setIsSaved(saveState || false);
                }

                // Obtener contadores públicos desde la vista content_stats
                const { data: stats } = await supabase
                    .from('content_stats')
                    .select('likes_count, saves_count')
                    .eq('content_id', contentId)
                    .maybeSingle();

                setLikesCount(stats?.likes_count || 0);
                setSavesCount(stats?.saves_count || 0);
            } catch (error) {
                console.error('Error loading interactions:', error);
            } finally {
                setLoading(false);
            }
        }

        loadInteractions();
    }, [contentId]);

    // Toggle Like
    const toggleLike = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return { error: 'login_required' };

            const { data, error } = await supabase
                .rpc('toggle_interaction', {
                    target_content_id: contentId,
                    interaction_type: 'like'
                });

            if (error) throw error;

            // Actualizar estado local
            setIsLiked(data);
            setLikesCount(prev => (data ? Number(prev) + 1 : Number(prev) - 1));
            return { success: true, state: data };
        } catch (error) {
            console.error('Error toggling like:', error);
            return { error };
        }
    };

    // Toggle Save
    const toggleSave = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return { error: 'login_required' };

            const { data, error } = await supabase
                .rpc('toggle_interaction', {
                    target_content_id: contentId,
                    interaction_type: 'save'
                });

            if (error) throw error;

            setIsSaved(data);
            setSavesCount(prev => (data ? Number(prev) + 1 : Number(prev) - 1));
            return { success: true, state: data };
        } catch (error) {
            console.error('Error toggling save:', error);
            return { error };
        }
    };

    return {
        isLiked,
        isSaved,
        likesCount,
        savesCount,
        toggleLike,
        toggleSave,
        loading
    };
}
