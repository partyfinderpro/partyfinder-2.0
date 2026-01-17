'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

export interface PremiumFiltersState {
    category?: string[];
    distance_km?: number;
    age_range?: [number, number];
    price_range?: [number, number];
    services?: string[];
    verified_only?: boolean;
    available_now?: boolean;
    new_in_town?: boolean;
    last_active?: '1h' | '24h' | '7d';
}

export function PremiumFilterPanel({ onApply }: { onApply?: (filters: PremiumFiltersState) => void }) {
    const [filters, setFilters] = useState<PremiumFiltersState>({});
    const [isPremium, setIsPremium] = useState(false);
    const [isOpen, setIsOpen] = useState(false); // Mobile toggle

    useEffect(() => {
        checkPremiumStatus();
    }, []);

    const checkPremiumStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('user_subscriptions')
            .select('tier')
            .eq('user_id', user.id)
            .eq('active', true)
            .single();

        setIsPremium(data?.tier === 'premium');
    };

    const applyFilters = () => {
        if (!isPremium) {
            // Trigger checkout (mock for now)
            alert("🔒 Función Premium: Desbloquea filtros avanzados por solo $4.99");
            return;
        }
        onApply?.(filters);
        setIsOpen(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-24 right-4 z-40 bg-venuz-pink text-white p-3 rounded-full shadow-lg md:hidden"
            >
                🧬 Filtros
            </button>

            <AnimatePresence>
                {(isOpen || typeof window !== 'undefined' && window.innerWidth >= 768) && (
                    <motion.div
                        initial={{ x: 300 }}
                        animate={{ x: 0 }}
                        exit={{ x: 300 }}
                        className={`fixed right-0 top-0 bottom-0 w-80 bg-black/95 backdrop-blur-md border-l border-white/10 overflow-y-auto p-6 z-50 transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Filtros</h2>
                            {!isPremium && (
                                <span className="text-xs bg-gradient-to-r from-venuz-pink to-venuz-gold text-white px-2 py-1 rounded-full animate-pulse">
                                    Premium
                                </span>
                            )}
                            <button onClick={() => setIsOpen(false)} className="md:hidden text-white">✕</button>
                        </div>

                        {/* Distancia (GRATIS con límite) */}
                        <div className="mb-6">
                            <label className="text-sm text-gray-400 mb-2 block">Distancia (km)</label>
                            <input
                                type="range"
                                min="1"
                                max={isPremium ? "100" : "10"}
                                value={filters.distance_km || 10}
                                onChange={(e) => setFilters({ ...filters, distance_km: parseInt(e.target.value) })}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-venuz-pink"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>1km</span>
                                <span className="text-venuz-pink font-bold">{filters.distance_km || 10}km</span>
                                <span>{isPremium ? '100km' : '10km'}</span>
                            </div>
                            {!isPremium && <p className="text-xs text-yellow-500 mt-1">🔒 Premium: hasta 100km</p>}
                        </div>

                        {/* PREMIUM SECTION */}
                        <div className={`relative space-y-6 ${!isPremium ? 'opacity-50 pointer-events-none' : ''}`}>
                            {!isPremium && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-auto">
                                    <button
                                        onClick={applyFilters}
                                        className="bg-gradient-to-r from-venuz-pink to-venuz-gold text-white px-6 py-3 rounded-full font-bold shadow-lg transform hover:scale-105 transition-all"
                                    >
                                        🔓 Desbloquear Premium
                                    </button>
                                </div>
                            )}

                            {/* Edad */}
                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">Edad</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        className="w-full bg-white/10 rounded p-2 text-white text-sm"
                                        onChange={(e) => setFilters({ ...filters, age_range: [parseInt(e.target.value), filters.age_range?.[1] || 50] })}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        className="w-full bg-white/10 rounded p-2 text-white text-sm"
                                        onChange={(e) => setFilters({ ...filters, age_range: [filters.age_range?.[0] || 18, parseInt(e.target.value)] })}
                                    />
                                </div>
                            </div>

                            {/* Precio */}
                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">Precio (USD)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        className="w-full bg-white/10 rounded p-2 text-white text-sm"
                                        onChange={(e) => setFilters({ ...filters, price_range: [parseInt(e.target.value), filters.price_range?.[1] || 1000] })}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        className="w-full bg-white/10 rounded p-2 text-white text-sm"
                                        onChange={(e) => setFilters({ ...filters, price_range: [filters.price_range?.[0] || 0, parseInt(e.target.value)] })}
                                    />
                                </div>
                            </div>

                            {/* Opciones Checkbox */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                                    <input type="checkbox" className="accent-venuz-pink"
                                        checked={filters.verified_only}
                                        onChange={(e) => setFilters({ ...filters, verified_only: e.target.checked })}
                                    /> Solo Verificados ✅
                                </label>
                                <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                                    <input type="checkbox" className="accent-venuz-pink"
                                        checked={filters.available_now}
                                        onChange={(e) => setFilters({ ...filters, available_now: e.target.checked })}
                                    /> Disponibles Ahora 🟢
                                </label>
                            </div>

                        </div>

                        {/* Apply Button */}
                        <button
                            onClick={applyFilters}
                            className="w-full mt-8 bg-venuz-pink hover:bg-venuz-pink/80 text-white py-3 rounded-full font-bold transition-all"
                        >
                            {isPremium ? 'Aplicar Filtros' : 'Hacerme Premium'}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
