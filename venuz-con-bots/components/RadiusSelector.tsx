// components/RadiusSelector.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown } from 'lucide-react';
import { RADIUS_LEVELS, formatRadiusDisplay } from '@/lib/geo-expansion';

interface RadiusSelectorProps {
    currentRadius: number;
    onRadiusChange: (radius: number) => void;
    disabled?: boolean;
}

export default function RadiusSelector({
    currentRadius,
    onRadiusChange,
    disabled = false
}: RadiusSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
          flex items-center gap-2 px-4 py-2 rounded-full
          bg-black/60 backdrop-blur-md border border-white/10
          text-white text-sm font-medium
          hover:bg-white/10 transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
            >
                <MapPin className="w-4 h-4 text-venuz-pink" />
                <span>{formatRadiusDisplay(currentRadius)}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full mt-2 right-0 z-50
                       bg-black/95 backdrop-blur-xl border border-white/10
                       rounded-xl overflow-hidden min-w-[140px] shadow-2xl"
                    >
                        {RADIUS_LEVELS.map((radius) => (
                            <button
                                key={radius}
                                onClick={() => {
                                    onRadiusChange(radius);
                                    setIsOpen(false);
                                }}
                                className={`
                  w-full text-left px-4 py-3 text-sm font-medium
                  transition-all hover:bg-white/10
                  ${radius === currentRadius
                                        ? 'bg-venuz-pink/20 text-venuz-pink'
                                        : 'text-white/80 hover:text-white'}
                `}
                            >
                                <div className="flex items-center justify-between">
                                    <span>{formatRadiusDisplay(radius)}</span>
                                    {radius === currentRadius && (
                                        <span className="w-2 h-2 rounded-full bg-venuz-pink" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Overlay para cerrar al hacer click afuera */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
