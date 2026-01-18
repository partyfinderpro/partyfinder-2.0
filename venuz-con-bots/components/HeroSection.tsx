'use client';

import { motion } from 'framer-motion';
import { Search, TrendingUp, MapPin } from 'lucide-react';
import { useState } from 'react';

interface HeroSectionProps {
    onNearbyClick?: () => void;
}

export default function HeroSection({ onNearbyClick }: HeroSectionProps) {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden px-4 py-20">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-deep-black via-purple-950/20 to-deep-black"></div>
            <div className="absolute inset-0 bg-gradient-glow opacity-30 animate-pulse"></div>

            {/* Floating shapes */}
            <motion.div
                animate={{
                    y: [0, -20, 0],
                    rotate: [0, 5, 0]
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute top-20 left-10 w-32 h-32 bg-neon-purple/10 rounded-full blur-3xl"
            />
            <motion.div
                animate={{
                    y: [0, 20, 0],
                    rotate: [0, -5, 0]
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute bottom-20 right-10 w-40 h-40 bg-hot-magenta/10 rounded-full blur-3xl"
            />

            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="neon-text text-5xl md:text-7xl lg:text-8xl mb-4">
                        Descubre la Noche
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 font-light">
                        Los mejores lugares, eventos y experiencias cerca de ti
                    </p>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="flex items-center justify-center gap-2 text-sm"
                >
                    <div className="pulse-dot"></div>
                    <span className="text-gray-400">
                        <span className="text-neon-purple font-bold animate-glow-pulse">10,234</span> usuarios explorando ahora
                    </span>
                </motion.div>

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="max-w-2xl mx-auto"
                >
                    <div className="relative glass-effect rounded-full p-2 flex items-center gap-3">
                        <Search className="w-5 h-5 text-gray-400 ml-4" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="¿Qué buscas esta noche?"
                            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
                        />
                        <button className="btn-casino px-6 py-2 text-sm">
                            Buscar
                        </button>
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    className="flex flex-wrap items-center justify-center gap-3"
                >
                    <button className="glass-effect px-4 py-2 rounded-full hover:bg-white/10 transition-colors flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-alert-orange" />
                        <span className="text-sm">Tendencias</span>
                    </button>
                    <button
                        onClick={onNearbyClick}
                        className="glass-effect px-4 py-2 rounded-full hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                        <MapPin className="w-4 h-4 text-electric-cyan" />
                        <span className="text-sm">Cerca de ti</span>
                    </button>
                </motion.div>
            </div>
        </section>
    );
}
