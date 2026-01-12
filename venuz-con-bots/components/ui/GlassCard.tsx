import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    intensity?: 'light' | 'medium' | 'strong';
    hover?: boolean;
}

export function GlassCard({
    children,
    className,
    intensity = 'medium',
    hover = true
}: GlassCardProps) {
    const intensityClasses = {
        light: 'backdrop-blur-sm bg-white/5 border-white/10',
        medium: 'backdrop-blur-md bg-white/10 border-white/20',
        strong: 'backdrop-blur-xl bg-white/15 border-white/30'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={hover ? { scale: 1.02, y: -4 } : {}}
            transition={{ duration: 0.3 }}
            className={cn(
                'rounded-2xl border shadow-2xl',
                'transition-all duration-300',
                intensityClasses[intensity],
                hover && 'hover:shadow-pink-500/20',
                className
            )}
        >
            {children}
        </motion.div>
    );
}
