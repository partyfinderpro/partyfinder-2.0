'use client';

import { cn } from '@/lib/utils';

interface LiveBadgeProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    animated?: boolean;
}

export default function LiveBadge({
    className,
    size = 'md',
    animated = true
}: LiveBadgeProps) {
    const sizes = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-3 py-1',
        lg: 'text-base px-4 py-1.5',
    };

    return (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full font-accent font-bold",
                "bg-red-600 text-white shadow-lg",
                animated && "animate-glow-pulse",
                sizes[size],
                className
            )}
        >
            <span className="pulse-dot"></span>
            LIVE
        </div>
    );
}
