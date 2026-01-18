'use client';

import { motion } from 'framer-motion';
import { Trophy, Star, Flame, Award } from 'lucide-react';

interface AchievementToastProps {
    title: string;
    description: string;
    xp: number;
    icon?: 'trophy' | 'star' | 'flame' | 'award';
}

const icons = {
    trophy: Trophy,
    star: Star,
    flame: Flame,
    award: Award,
};

export default function AchievementToast({
    title,
    description,
    xp,
    icon = 'trophy'
}: AchievementToastProps) {
    const Icon = icons[icon];

    return (
        <motion.div
            initial={{ y: -100, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -100, opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative overflow-hidden"
        >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-casino opacity-20 blur-xl"></div>

            {/* Content */}
            <div className="relative glass-effect rounded-2xl p-4 flex items-center gap-4 min-w-[300px]">
                {/* Icon */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-casino blur-md opacity-50 animate-neon-pulse"></div>
                    <div className="relative w-12 h-12 rounded-full bg-gradient-casino flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                </div>

                {/* Text */}
                <div className="flex-1">
                    <h4 className="font-accent font-bold text-white text-lg">
                        {title}
                    </h4>
                    <p className="text-gray-300 text-sm">
                        {description}
                    </p>
                </div>

                {/* XP Badge */}
                <div className="bg-casino-gold/20 border border-casino-gold/50 rounded-full px-3 py-1">
                    <span className="text-casino-gold font-bold text-sm">
                        +{xp} XP
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
