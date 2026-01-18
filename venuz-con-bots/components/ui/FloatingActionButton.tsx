'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
    icon: LucideIcon;
    onClick: () => void;
    label?: string;
    position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
    className?: string;
}

export default function FloatingActionButton({
    icon: Icon,
    onClick,
    label,
    position = 'bottom-right',
    className
}: FloatingActionButtonProps) {
    const positions = {
        'bottom-right': 'bottom-6 right-6',
        'bottom-left': 'bottom-6 left-6',
        'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
    };

    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            className={cn(
                "fixed z-50 flex items-center gap-2",
                "w-14 h-14 rounded-full",
                "bg-gradient-casino shadow-2xl",
                "hover:shadow-3xl transition-all duration-300",
                "animate-neon-pulse justify-center",
                positions[position],
                label && "w-auto px-6",
                className
            )}
            aria-label={label || 'Action button'}
        >
            <Icon className="w-6 h-6 text-white" />
            {label && (
                <span className="font-accent font-bold text-white pr-2">
                    {label}
                </span>
            )}
        </motion.button>
    );
}
