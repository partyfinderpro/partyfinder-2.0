'use client';

import { cn } from '@/lib/utils';
import * as Progress from '@radix-ui/react-progress';

interface ProgressBarProps {
    value: number;
    max?: number;
    label?: string;
    showPercentage?: boolean;
    className?: string;
    animated?: boolean;
}

export default function ProgressBar({
    value,
    max = 100,
    label,
    showPercentage = true,
    className,
    animated = true
}: ProgressBarProps) {
    const percentage = Math.min((value / max) * 100, 100);

    return (
        <div className={cn("space-y-2", className)}>
            {/* Label */}
            {(label || showPercentage) && (
                <div className="flex justify-between items-center text-sm">
                    {label && <span className="text-gray-300 font-medium">{label}</span>}
                    {showPercentage && (
                        <span className="text-neon-purple font-bold">
                            {Math.round(percentage)}%
                        </span>
                    )}
                </div>
            )}

            {/* Progress bar */}
            <Progress.Root
                value={percentage}
                max={100}
                className="relative h-3 w-full overflow-hidden rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700/50"
            >
                <Progress.Indicator
                    className={cn(
                        "h-full bg-gradient-casino relative progress-glow",
                        "transition-all duration-500 ease-out",
                        animated && "animate-shimmer"
                    )}
                    style={{
                        width: `${percentage}%`,
                        transform: `translateX(-${100 - percentage}%)`
                    }}
                />
            </Progress.Root>
        </div>
    );
}
