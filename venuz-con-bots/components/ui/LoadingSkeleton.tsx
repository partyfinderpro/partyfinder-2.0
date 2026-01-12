// components/ui/LoadingSkeleton.tsx
import { motion } from 'framer-motion';

export function LoadingSkeleton() {
    return (
        <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
            {/* Image skeleton */}
            <motion.div
                className="aspect-[4/3] bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800"
                animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear'
                }}
                style={{
                    backgroundSize: '200% 100%'
                }}
            />

            {/* Content skeleton */}
            <div className="p-4 space-y-3">
                {/* Title */}
                <div className="h-6 bg-zinc-800 rounded-lg w-3/4 animate-pulse" />

                {/* Metadata */}
                <div className="h-4 bg-zinc-800 rounded w-1/2 animate-pulse" />

                {/* Description */}
                <div className="space-y-2">
                    <div className="h-3 bg-zinc-800 rounded w-full animate-pulse" />
                    <div className="h-3 bg-zinc-800 rounded w-2/3 animate-pulse" />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                    <div className="h-10 bg-zinc-800 rounded-xl w-20 animate-pulse" />
                    <div className="h-10 bg-zinc-800 rounded-xl w-20 animate-pulse" />
                    <div className="h-10 bg-zinc-800 rounded-xl flex-1 animate-pulse" />
                </div>
            </div>
        </div>
    );
}
