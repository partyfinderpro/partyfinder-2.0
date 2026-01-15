'use client';

import { usePreferences } from '@/context/PreferencesContext';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import NotificationToggle from '@/components/NotificationToggle';

const CATEGORIES = [
    { id: 'club', label: 'Clubes', icon: '🎉' },
    { id: 'bar', label: 'Bares', icon: '🍺' },
    { id: 'restaurante', label: 'Restaurantes', icon: '🍽️' },
    { id: 'evento', label: 'Eventos', icon: '🎪' },
    { id: 'beach', label: 'Playas', icon: '🏖️' },
    { id: 'hotel', label: 'Hoteles', icon: '🏨' },
    { id: 'tabledance', label: 'Table Dance', icon: '💃' },
    { id: 'masaje', label: 'Masajes', icon: '💆' },
];

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const { preferences, updatePreference, resetPreferences, loading } = usePreferences();
    const [resetConfirm, setResetConfirm] = useState(false);

    useEffect(() => {
        async function checkAuth() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setAuthLoading(false);
        }
        checkAuth();
    }, []);

    const toggleCategory = (categoryId: string) => {
        const current = preferences.favorite_categories || [];
        const newCategories = current.includes(categoryId)
            ? current.filter(c => c !== categoryId)
            : [...current, categoryId];
        updatePreference('favorite_categories', newCategories);
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black pb-20">
            <header className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-10 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto">
                    <Link href="/" className="text-pink-200 hover:text-white mb-4 inline-block">← Volver</Link>
                    <h1 className="text-4xl font-bold text-white flex items-center gap-3">⚙️ Configuración</h1>
                    <p className="text-pink-100 mt-2">Personaliza tu experiencia en VENUZ</p>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                {/* Tema */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900 rounded-2xl p-6 border border-pink-500/20">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">🎨 Apariencia</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-gray-400 mb-2 block">Tema</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => updatePreference('theme', 'dark')}
                                    className={`p-4 rounded-xl border-2 transition-all ${preferences.theme === 'dark' ? 'border-pink-500 bg-pink-500/10' : 'border-gray-700 hover:border-gray-600'}`}
                                >
                                    <div className="text-3xl mb-2">🌙</div>
                                    <p className="text-white font-semibold">Oscuro</p>
                                </button>
                                <button
                                    onClick={() => updatePreference('theme', 'light')}
                                    className={`p-4 rounded-xl border-2 transition-all ${preferences.theme === 'light' ? 'border-pink-500 bg-pink-500/10' : 'border-gray-700 hover:border-gray-600'}`}
                                >
                                    <div className="text-3xl mb-2">☀️</div>
                                    <p className="text-white font-semibold">Claro</p>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-gray-400 mb-2 block">Idioma</label>
                            <select
                                value={preferences.language}
                                onChange={(e) => updatePreference('language', e.target.value as 'es' | 'en')}
                                className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-pink-500 focus:outline-none"
                            >
                                <option value="es">🇲🇽 Español</option>
                                <option value="en">🇺🇸 English</option>
                            </select>
                        </div>
                    </div>
                </motion.div>

                {/* Radio de búsqueda */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gray-900 rounded-2xl p-6 border border-pink-500/20">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">📍 Ubicación</h2>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-gray-400">Radio de búsqueda</label>
                            <span className="text-pink-400 font-bold">{preferences.location_radius_km} km</span>
                        </div>
                        <input
                            type="range" min="5" max="50" step="5"
                            value={preferences.location_radius_km}
                            onChange={(e) => updatePreference('location_radius_km', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>5 km</span><span>25 km</span><span>50 km</span>
                        </div>
                    </div>
                </motion.div>

                {/* Categorías favoritas */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gray-900 rounded-2xl p-6 border border-pink-500/20">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">⭐ Categorías Favoritas</h2>
                    <p className="text-gray-400 text-sm mb-4">Selecciona tus categorías favoritas para personalizar tu feed</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {CATEGORIES.map((category) => {
                            const isSelected = preferences.favorite_categories?.includes(category.id);
                            return (
                                <button
                                    key={category.id}
                                    onClick={() => toggleCategory(category.id)}
                                    className={`p-3 rounded-xl border-2 transition-all ${isSelected ? 'border-pink-500 bg-pink-500/10' : 'border-gray-700 hover:border-gray-600'}`}
                                >
                                    <div className="text-2xl mb-1">{category.icon}</div>
                                    <p className="text-white text-sm font-semibold">{category.label}</p>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Notificaciones Push */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <NotificationToggle />
                </motion.div>

                {/* Reset */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-gray-900 rounded-2xl p-6 border border-red-500/20">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">🔄 Restaurar Configuración</h2>
                    <p className="text-gray-400 text-sm mb-4">Restaurar todas las preferencias a sus valores por defecto</p>
                    {!resetConfirm ? (
                        <button onClick={() => setResetConfirm(true)} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-3 rounded-xl font-semibold transition-colors">
                            Restaurar Defaults
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-yellow-400 text-sm">⚠️ ¿Estás seguro? Esta acción no se puede deshacer.</p>
                            <div className="flex gap-3">
                                <button onClick={() => { resetPreferences(); setResetConfirm(false); }} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors">Sí, restaurar</button>
                                <button onClick={() => setResetConfirm(false)} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors">Cancelar</button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
