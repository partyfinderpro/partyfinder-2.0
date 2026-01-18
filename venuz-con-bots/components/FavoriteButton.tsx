// components/FavoriteButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
    contentId: string;
    initialFavorited?: boolean;
    showCount?: boolean;
}

export function FavoriteButton({
    contentId,
    initialFavorited = false,
    showCount = false
}: FavoriteButtonProps) {
    const [isFavorited, setIsFavorited] = useState(initialFavorited);
    const [favoriteCount, setFavoriteCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        checkIfFavorited();
        if (showCount) getFavoriteCount();
    }, [contentId]);

    const checkIfFavorited = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('content_id', contentId)
            .single();

        setIsFavorited(!!data);
    };

    const getFavoriteCount = async () => {
        const { count } = await supabase
            .from('favorites')
            .select('*', { count: 'exact', head: true })
            .eq('content_id', contentId);

        setFavoriteCount(count || 0);
    };

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation();

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            // TODO: Mostrar modal de login
            console.log('Debes iniciar sesión para guardar favoritos');
            return;
        }

        // Optimistic update
        const wasLiked = isFavorited;
        setIsFavorited(!isFavorited);
        setIsLoading(true);

        try {
            if (wasLiked) {
                // Quitar de favoritos
                await supabase
                    .from('favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('content_id', contentId);

                if (showCount) setFavoriteCount(prev => Math.max(0, prev - 1));
            } else {
                // Agregar a favoritos
                await supabase
                    .from('favorites')
                    .insert({
                        user_id: user.id,
                        content_id: contentId,
                    });

                if (showCount) setFavoriteCount(prev => prev + 1);
            }
        } catch (error) {
            // Revertir en caso de error
            setIsFavorited(wasLiked);
            console.error('Error toggling favorite:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={toggleFavorite}
            disabled={isLoading}
            className="group relative flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all rounded-full px-4 py-2"
        >
            <motion.div
                whileTap={{ scale: 0.8 }}
                animate={{ scale: isFavorited ? 1.2 : 1 }}
                transition={{ duration: 0.2 }}
            >
                <Heart
                    className={`w-5 h-5 transition-colors ${isFavorited
                            ? 'fill-venuz-pink text-venuz-pink'
                            : 'text-white'
                        }`}
                />
            </motion.div>

            {showCount && favoriteCount > 0 && (
                <span className="text-xs text-white/70">
                    {favoriteCount}
                </span>
            )}
        </button>
    );
}
