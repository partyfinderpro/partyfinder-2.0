'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

// Local simplified type
type ContentCategory = string;

interface LikeButtonProps {
    contentId: string;
    category?: ContentCategory; // Made optional to be safe
    initialLiked?: boolean;
    initialCount?: number;
    isNSFW?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'default' | 'minimal' | 'floating';
    showCount?: boolean;
    onLike?: (id: string, category: string, isNSFW: boolean) => void;
    className?: string;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    color: string;
}

const PARTICLE_COLORS = [
    '#FF1493', // Deep Pink
    '#FF69B4', // Hot Pink
    '#FFB6C1', // Light Pink
    '#FF6B6B', // Coral
    '#FFA500', // Orange (VENUZ brand)
    '#FFD700', // Gold (VENUZ brand)
];

const SIZE_CONFIG = {
    sm: {
        button: 'w-8 h-8',
        icon: 16,
        particles: 6,
    },
    md: {
        button: 'w-10 h-10',
        icon: 20,
        particles: 8,
    },
    lg: {
        button: 'w-14 h-14',
        icon: 28,
        particles: 12,
    },
    xl: {
        button: 'w-20 h-20',
        icon: 40,
        particles: 16,
    },
};

export function LikeButton({
    contentId,
    category = 'general',
    initialLiked = false,
    initialCount = 0,
    isNSFW = false,
    size = 'lg',
    variant = 'default',
    showCount = true,
    onLike,
    className,
}: LikeButtonProps) {
    const [liked, setLiked] = useState(initialLiked);
    const [count, setCount] = useState(initialCount);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const config = SIZE_CONFIG[size];

    const generateParticles = useCallback(() => {
        const newParticles: Particle[] = [];
        const particleCount = config.particles;

        for (let i = 0; i < particleCount; i++) {
            const angle = (360 / particleCount) * i;
            const distance = 30 + Math.random() * 40;

            newParticles.push({
                id: i,
                x: Math.cos((angle * Math.PI) / 180) * distance,
                y: Math.sin((angle * Math.PI) / 180) * distance,
                scale: 0.4 + Math.random() * 0.6,
                rotation: Math.random() * 360,
                color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
            });
        }

        return newParticles;
    }, [config.particles]);

    const handleClick = useCallback(() => {
        const newLiked = !liked;
        setLiked(newLiked);
        setCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));

        if (newLiked) {
            setIsAnimating(true);
            setParticles(generateParticles());

            // Call parent handler
            onLike?.(contentId, category, isNSFW);

            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(50);
            }

            setTimeout(() => {
                setParticles([]);
                setIsAnimating(false);
            }, 700);
        }
    }, [liked, contentId, category, isNSFW, generateParticles, onLike]);

    const buttonStyles = {
        default: cn(
            'relative flex items-center justify-center rounded-full',
            'bg-black/60 backdrop-blur-sm border-2',
            'transition-all duration-200 ease-out',
            'hover:scale-110 active:scale-95',
            'focus:outline-none focus:ring-2 focus:ring-pink-500/50',
            liked
                ? 'border-pink-500 shadow-lg shadow-pink-500/30'
                : 'border-white/20 hover:border-white/40',
            config.button
        ),
        minimal: cn(
            'relative flex items-center justify-center',
            'transition-all duration-200 ease-out',
            'hover:scale-125 active:scale-90',
            config.button
        ),
        floating: cn(
            'relative flex items-center justify-center rounded-full',
            'bg-gradient-to-br from-pink-500 to-orange-500',
            'shadow-xl shadow-pink-500/40',
            'transition-all duration-200 ease-out',
            'hover:scale-110 hover:shadow-2xl hover:shadow-pink-500/50',
            'active:scale-95',
            config.button
        ),
    };

    return (
        <div className={cn('relative inline-flex flex-col items-center gap-1', className)}>
            <motion.button
                ref={buttonRef}
                onClick={handleClick}
                className={buttonStyles[variant]}
                whileTap={{ scale: 0.9 }}
                aria-label={liked ? 'Unlike' : 'Like'}
            >
                <motion.div
                    animate={isAnimating ? {
                        scale: [1, 1.5, 0.8, 1.2, 1],
                        rotate: [0, -10, 10, -5, 0],
                    } : {}}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    <Heart
                        size={config.icon}
                        className={cn(
                            'transition-all duration-200',
                            liked
                                ? 'fill-pink-500 text-pink-500 drop-shadow-glow'
                                : 'text-white/80'
                        )}
                        strokeWidth={liked ? 0 : 2}
                    />
                </motion.div>

                <AnimatePresence>
                    {particles.map((particle) => (
                        <motion.div
                            key={particle.id}
                            className="absolute pointer-events-none"
                            initial={{
                                x: 0,
                                y: 0,
                                scale: 0,
                                opacity: 1,
                                rotate: 0
                            }}
                            animate={{
                                x: particle.x,
                                y: particle.y,
                                scale: particle.scale,
                                opacity: 0,
                                rotate: particle.rotation
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: 0.6,
                                ease: 'easeOut'
                            }}
                        >
                            <Heart
                                size={config.icon * 0.4}
                                style={{ color: particle.color, fill: particle.color }}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>

                {liked && (
                    <motion.div
                        className="absolute inset-0 rounded-full border-2 border-pink-500"
                        initial={{ scale: 1, opacity: 0.8 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 0.6, repeat: 0 }}
                    />
                )}
            </motion.button>

            {showCount && (
                <motion.span
                    key={count}
                    initial={{ y: -5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={cn(
                        'text-xs font-medium tabular-nums',
                        liked ? 'text-pink-400' : 'text-white/60'
                    )}
                >
                    {formatCount(count)}
                </motion.span>
            )}
        </div>
    );
}

function formatCount(num: number): string {
    if (num < 1000) return num.toString();
    if (num < 10000) return `${(num / 1000).toFixed(1)}k`;
    if (num < 1000000) return `${Math.floor(num / 1000)}k`;
    return `${(num / 1000000).toFixed(1)}M`;
}
