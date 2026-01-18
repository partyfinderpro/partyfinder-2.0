'use client';

import { cn } from '@/lib/utils';

interface SkeletonCardProps {
    count?: number;
    className?: string;
}

export default function SkeletonCard({ count = 1, className }: SkeletonCardProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        "card-casino animate-pulse p-4 space-y-4",
                        className
                    )}
                >
                    {/* Image skeleton */}
                    <div className="relative h-64 bg-gray-800/50 shimmer rounded-xl overflow-hidden"></div>

                    {/* Content skeleton */}
                    <div className="space-y-3">
                        <div className="h-6 bg-gray-800/50 rounded shimmer w-3/4"></div>
                        <div className="flex gap-2">
                            <div className="h-4 bg-gray-800/50 rounded shimmer w-20"></div>
                            <div className="h-4 bg-gray-800/50 rounded shimmer w-16"></div>
                        </div>
                        <div className="h-10 bg-gray-800/50 rounded-full shimmer w-full"></div>
                    </div>
                </div>
            ))}
        </>
    );
}
