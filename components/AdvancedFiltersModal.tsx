// components/AdvancedFiltersModal.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, MapPin, Clock, BadgeCheck, DollarSign } from 'lucide-react';

export interface FilterOptions {
    radius: number; // km
    priceRange: [number, number]; // 1-4 ($ to $$$$)
    verifiedOnly: boolean;
    openNow: boolean;
    hasVideo: boolean;
}

interface AdvancedFiltersModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: FilterOptions) => void;
    currentFilters: FilterOptions;
}

export default function AdvancedFiltersModal({
    isOpen,
    onClose,
    onApply,
    currentFilters
}: AdvancedFiltersModalProps) {
    const [filters, setFilters] = useState<FilterOptions>(currentFilters);

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const handleReset = () => {
        setFilters({
            radius: 50,
            priceRange: [1, 4],
            verifiedOnly: false,
            openNow: false,
            hasVideo: false
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] md:h-auto md:rounded-3xl h-[85vh] bg-[#121214] border border-white/10 rounded-t-3xl z-50 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-venuz-pink" />
                                Filtros Avanzados
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5 text-white/70" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">

                            {/* Distancia */}
                            <section>
                                <div className="flex justify-between mb-4">
                                    <label className="text-white font-semibold flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-blue-400" />
                                        Distancia
                                    </label>
                                    <span className="text-blue-400 font-bold">{filters.radius} km</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="100"
                                    step="1"
                                    value={filters.radius}
                                    onChange={(e) => setFilters({ ...filters, radius: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-2">
                                    <span>1 km</span>
                                    <span>50 km</span>
                                    <span>100 km</span>
                                </div>
                            </section>

                            {/* Toggles Inteligentes */}
                            <section className="space-y-4">
                                {/* Verified Only */}
                                <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                            <BadgeCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">Solo Verificados</h3>
                                            <p className="text-xs text-white/50">Mostrar solo cuentas oficiales</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.verifiedOnly}
                                            onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    </label>
                                </div>

                                {/* Open Now */}
                                <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">Abierto Ahora</h3>
                                            <p className="text-xs text-white/50">Lugares disponibles en este momento</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.openNow}
                                            onChange={(e) => setFilters({ ...filters, openNow: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                    </label>
                                </div>
                            </section>

                            {/* Rango de Precio */}
                            <section>
                                <label className="text-white font-semibold flex items-center gap-2 mb-4">
                                    <DollarSign className="w-4 h-4 text-green-400" />
                                    Rango de Precio
                                </label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4].map((level) => {
                                        const isSelected = filters.priceRange[0] <= level && filters.priceRange[1] >= level;
                                        return (
                                            <button
                                                key={level}
                                                onClick={() => {
                                                    // Lógica simple para rango: click establece min o max dinámicamente o toggle
                                                    // Por simplicidad: toggle on/off en un sistema de checkbox, o select single
                                                    // Mejor UX: Click en uno selecciona "hasta ese nivel"
                                                    setFilters({ ...filters, priceRange: [1, level] });
                                                }}
                                                className={`flex-1 py-3 rounded-xl border font-bold transition-all ${isSelected
                                                        ? 'bg-green-500/20 border-green-500 text-green-400'
                                                        : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10'
                                                    }`}
                                            >
                                                {Array(level).fill('$').join('')}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/5 bg-black/50 md:rounded-b-3xl flex gap-4">
                            <button
                                onClick={handleReset}
                                className="px-6 py-3 rounded-xl bg-white/5 text-white/70 font-medium hover:bg-white/10 transition"
                            >
                                Resetear
                            </button>
                            <button
                                onClick={handleApply}
                                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-venuz-pink to-purple-600 text-white font-bold shadow-lg hover:shadow-venuz-pink/20 transition active:scale-95"
                            >
                                Aplicar Filtros
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
