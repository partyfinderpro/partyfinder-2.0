'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useFavorites } from '@/hooks/useFavorites';
import { useState, useEffect } from 'react';

interface FavoriteButtonProps {
    contentId: string;
    size?: 'sm' | 'md' | 'lg';
    showCount?: boolean;
    showLabel?: boolean;
    onAuthRequired?: () => void;
}

export default function FavoriteButton({
    contentId,
    size = 'md',
    showCount = false,
    showLabel = false,
    onAuthRequired
}: FavoriteButtonProps) {
    const { isFavorite, toggleFavorite, getFavoriteCount, error } = useFavorites();
    const [isAnimating, setIsAnimating] = useState(false);
    const [count, setCount] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const favorite = isFavorite(contentId);

    // Cargar contador
    useEffect(() => {
        if (showCount) {
            getFavoriteCount(contentId).then(setCount);
        }
    }, [showCount, contentId, getFavoriteCount]);

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isProcessing) return;

        setIsProcessing(true);
        setIsAnimating(true);

        try {
            const newState = await toggleFavorite(contentId);

            if (showCount) {
                setCount(prev => newState ? prev + 1 : Math.max(0, prev - 1));
            }

            setTimeout(() => setIsAnimating(false), 600);
        } catch (err: any) {
            console.error('Error toggling favorite:', err);
            if (err.message === 'Not authenticated' && onAuthRequired) {
                onAuthRequired();
            }
            setIsAnimating(false);
        } finally {
            setIsProcessing(false);
        }
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
                disabled={isProcessing}
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
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
                aria-label={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
                <motion.div
                    animate={isAnimating ? {
                        scale: [1, 1.3, 1],
                        rotate: favorite ? [0, -15, 15, 0] : [0, 10, -10, 0],
                    } : {}}
                    transition={{ duration: 0.6 }}
                >
                    {favorite ? '❤️' : '🤍'}
                </motion.div>

                {/* Partículas */}
                <AnimatePresence>
                    {isAnimating && favorite && (
                        <>
                            {[...Array(8)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-1.5 h-1.5 bg-pink-400 rounded-full"
                                    initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                                    animate={{
                                        x: Math.cos(i * 45 * Math.PI / 180) * 35,
                                        y: Math.sin(i * 45 * Math.PI / 180) * 35,
                                        scale: 0,
                                        opacity: 0,
                                    }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                />
                            ))}
                        </>
                    )}
                </AnimatePresence>

                {/* Loading spinner */}
                {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </motion.button>

            {/* Contador */}
            {showCount && count > 0 && (
                <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-sm font-semibold text-gray-400"
                >
                    {count}
                </motion.span>
            )}

            {/* Label */}
            {showLabel && (
                <span className="text-sm text-gray-400">
                    {favorite ? 'Guardado' : 'Guardar'}
                </span>
            )}

            {/* Error */}
            {error && (
                <span className="text-xs text-red-400">Error</span>
            )}
        </div>
    );
}
