'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Zap, MapPin, Heart, Users, Music, Utensils, Waves, Smartphone, MessageCircle, Info } from 'lucide-react';
import clsx from 'clsx';

interface MegaMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectCategory: (id: string) => void;
    currentCategory: string;
}

const groups = [
    {
        title: '🌐 Explorar y Social',
        items: [
            { id: 'all', name: 'Muro Principal', icon: Zap, color: 'from-pink-500 to-rose-500' },
            { id: 'featured', name: 'Destacados 🔥', icon: Star, color: 'from-amber-400 to-yellow-600' },
            { id: 'nearby', name: 'Cerca de ti', icon: MapPin, color: 'from-blue-500 to-cyan-500' },
            { id: 'favorites', name: 'Mis Favoritos', icon: Heart, color: 'from-red-500 to-pink-500' },
        ]
    },
    {
        title: '🍸 Vida Nocturna y Fiesta',
        items: [
            { id: 'club', name: 'Antros / Clubs', icon: Music, color: 'from-purple-500 to-indigo-500' },
            { id: 'bar', name: 'Bares & Pubs', icon: Utensils, color: 'from-orange-500 to-red-500' },
            { id: 'show', name: 'Shows en Vivo', icon: Users, color: 'from-emerald-500 to-teal-500' },
            { id: 'beach', name: 'Beach Clubs', icon: Waves, color: 'from-cyan-400 to-blue-500' },
        ]
    },
    {
        title: '💎 Servicios Exclusivos',
        items: [
            { id: 'escort', name: 'Acompañantes', icon: Heart, color: 'from-rose-600 to-pink-700' },
            { id: 'masaje', name: 'Masajes VIP', icon: Heart, color: 'from-pink-400 to-rose-400' },
            { id: 'social_media', name: 'Creadoras', icon: Smartphone, color: 'from-blue-600 to-indigo-600' },
            { id: 'tabledance', name: 'Table Dance', icon: Music, color: 'from-purple-600 to-pink-600' },
        ]
    }
];

export default function MegaMenu({ isOpen, onClose, onSelectCategory, currentCategory }: MegaMenuProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col pt-safe px-6 pb-12 overflow-y-auto"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between py-6">
                        <h2 className="text-3xl font-display font-bold text-gradient">Categorías</h2>
                        <button
                            onClick={onClose}
                            className="w-12 h-12 rounded-full glass-strong flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Search bar placeholder style */}
                    <div className="mb-8 relative">
                        <input
                            type="text"
                            placeholder="¿Qué buscas hoy?"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-venuz-pink/50 placeholder:text-gray-500"
                            readOnly
                        />
                    </div>

                    {/* Grid Groups */}
                    <div className="space-y-10">
                        {groups.map((group) => (
                            <div key={group.title} className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">
                                    {group.title}
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {group.items.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = currentCategory === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    onSelectCategory(item.id);
                                                    onClose();
                                                }}
                                                className={clsx(
                                                    "relative group overflow-hidden rounded-2xl p-4 flex flex-col items-start gap-4 transition-all duration-300",
                                                    isActive ? "bg-white/10 ring-2 ring-venuz-pink" : "bg-white/5 hover:bg-white/10 border border-white/5"
                                                )}
                                            >
                                                <div className={clsx(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br transition-transform group-hover:scale-110",
                                                    item.color
                                                )}>
                                                    <Icon className="w-7 h-7 text-white" />
                                                </div>
                                                <span className={clsx(
                                                    "font-black text-base tracking-tight leading-none",
                                                    isActive ? "text-venuz-pink" : "text-white"
                                                )}>
                                                    {item.name}
                                                </span>

                                                {/* Glow effect on hover */}
                                                <div className="absolute inset-0 bg-venuz-pink/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer Info */}
                    <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-center gap-8 text-gray-500">
                        <button className="flex flex-col items-center gap-2">
                            <Info className="w-5 h-5" />
                            <span className="text-[10px]">Ayuda</span>
                        </button>
                        <button className="flex flex-col items-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-[10px]">Soporte</span>
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
