'use client';

import { motion } from 'framer-motion';
import { useFavorites } from '@/hooks/useFavorites';
import { useState } from 'react';

interface FavoriteButtonProps {
    contentId: string;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export default function FavoriteButton({
    contentId,
    size = 'md',
    showLabel = false
}: FavoriteButtonProps) {
    const { isFavorite, toggleFavorite, error } = useFavorites();
    const [isAnimating, setIsAnimating] = useState(false);

    const favorite = isFavorite(contentId);

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsAnimating(true);
        await toggleFavorite(contentId);
        setTimeout(() => setIsAnimating(false), 600);
    };

    const sizeClasses = {
        sm: 'w-8 h-8 text-lg',
        md: 'w-10 h-10 text-xl',
        lg: 'w-12 h-12 text-2xl',
    };

    return (
        <div className="flex items-center gap-2">
            <motion.button
                onClick={handleClick}
                whileTap={{ scale: 0.9 }}
                className={`
          ${sizeClasses[size]}
          flex items-center justify-center
          rounded-full
          ${favorite
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-800/80 text-gray-400 hover:text-pink-400'
                    }
          backdrop-blur-sm
          border border-pink-500/30
          transition-colors
          relative
          overflow-hidden
        `}
                aria-label={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
                <motion.div
                    animate={isAnimating ? {
                        scale: [1, 1.5, 1],
                        rotate: [0, -10, 10, 0],
                    } : {}}
                    transition={{ duration: 0.6 }}
                >
                    {favorite ? '❤️' : '🤍'}
                </motion.div>

                {/* Efecto de partículas */}
                {isAnimating && favorite && (
                    <>
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-1 h-1 bg-pink-400 rounded-full"
                                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                                animate={{
                                    x: Math.cos(i * 60 * Math.PI / 180) * 30,
                                    y: Math.sin(i * 60 * Math.PI / 180) * 30,
                                    scale: 0,
                                    opacity: 0,
                                }}
                                transition={{ duration: 0.6 }}
                            />
                        ))}
                    </>
                )}
            </motion.button>

            {showLabel && (
                <span className="text-sm text-gray-400">
                    {favorite ? 'Guardado' : 'Guardar'}
                </span>
            )}

            {error && (
                <span className="text-xs text-red-400">Error</span>
            )}
        </div>
    );
}
