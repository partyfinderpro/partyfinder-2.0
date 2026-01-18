'use client';

import { getHeatLevel } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface HeatIndicatorProps {
    activity: number;
    className?: string;
    showLabel?: boolean;
}

export default function HeatIndicator({
    activity,
    className,
    showLabel = true
}: HeatIndicatorProps) {
    const heat = getHeatLevel(activity);

    return (
        <div
            className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
                "bg-black/30 backdrop-blur-sm border",
                heat.level >= 2 && "border-red-500/50",
                heat.level === 1 && "border-yellow-500/50",
                heat.level === 0 && "border-blue-500/50",
                className
            )}
        >
            <span className="text-lg">{heat.emoji}</span>
            {showLabel && (
                <span className={cn("text-xs font-semibold", heat.color)}>
                    {heat.label}
                </span>
            )}
        </div>
    );
}
