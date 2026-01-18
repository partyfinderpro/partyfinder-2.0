'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, TrendingUp, X } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';

const LEVELS = [
    { name: "Novato", xp: 0, color: "from-gray-500 to-gray-600" },
    { name: "Explorador", xp: 100, color: "from-blue-500 to-blue-600" },
    { name: "Fiestero", xp: 500, color: "from-purple-500 to-purple-600" },
    { name: "VIP", xp: 2000, color: "from-yellow-500 to-yellow-600" },
    { name: "Leyenda", xp: 10000, color: "from-neon-purple to-hot-magenta" },
];

interface UserLevelProps {
    currentXP: number;
    className?: string;
}

export default function UserLevel({ currentXP, className }: UserLevelProps) {
    const [isVisible, setIsVisible] = useState(true);

    const currentLevelIndex = LEVELS.findIndex((level, i) => {
        const nextLevel = LEVELS[i + 1];
        return !nextLevel || currentXP < nextLevel.xp;
    });

    const currentLevel = LEVELS[currentLevelIndex];
    const nextLevel = LEVELS[currentLevelIndex + 1];

    const progressToNext = nextLevel
        ? ((currentXP - currentLevel.xp) / (nextLevel.xp - currentLevel.xp)) * 100
        : 100;

    if (!isVisible) return null;

    return (
        <div className={className}>
            <div className="glass-effect rounded-2xl p-6 space-y-4 shadow-2xl relative">
                {/* Close button */}
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Level badge */}
                <div className="flex items-center gap-4">
                    <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={cn(
                            "w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg",
                            currentLevel.color
                        )}
                    >
                        <Crown className="w-8 h-8 text-white" />
                    </motion.div>

                    <div className="flex-1">
                        <h3 className="font-accent text-2xl font-bold text-white">
                            {currentLevel.name}
                        </h3>
                        <p className="text-gray-400 text-sm">
                            {currentXP.toLocaleString()} XP
                        </p>
                    </div>

                    <TrendingUp className="w-6 h-6 text-green-400" />
                </div>

                {/* Progress to next level */}
                {nextLevel && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Próximo nivel:</span>
                            <span className="text-neon-purple font-bold">{nextLevel.name}</span>
                        </div>
                        <ProgressBar
                            value={progressToNext}
                            showPercentage={false}
                        />
                        <p className="text-xs text-gray-500 text-right">
                            {(nextLevel.xp - currentXP).toLocaleString()} XP para subir
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper needed since cn was missing in some imports
import { cn } from '@/lib/utils';
