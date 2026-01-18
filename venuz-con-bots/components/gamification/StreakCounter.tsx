'use client';

import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakCounterProps {
    days: number;
    className?: string;
}

export default function StreakCounter({ days, className }: StreakCounterProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                "bg-gradient-to-r from-orange-600 to-red-600",
                "shadow-lg animate-float",
                className
            )}
        >
            <Flame className="w-5 h-5 text-yellow-300 animate-glow-pulse" />
            <div className="flex flex-col">
                <span className="text-xs text-orange-100 font-medium">Racha</span>
                <span className="text-lg font-accent font-bold text-white leading-none">
                    {days} {days === 1 ? 'día' : 'días'}
                </span>
            </div>
        </div>
    );
}
