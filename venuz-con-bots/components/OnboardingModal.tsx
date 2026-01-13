'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, PartyPopper, Coffee, Sun } from 'lucide-react';
import clsx from 'clsx';

export default function OnboardingModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [preferences, setPreferences] = useState<string[]>([]);

    useEffect(() => {
        // Verificar si ya completó el onboarding
        const hasOnboarded = localStorage.getItem('venuz_onboarded');
        if (!hasOnboarded) {
            setIsOpen(true);
        }
    }, []);

    const handleComplete = () => {
        localStorage.setItem('venuz_onboarded', 'true');
        localStorage.setItem('venuz_preferences', JSON.stringify(preferences));
        setIsOpen(false);
    };

    const togglePreference = (id: string) => {
        if (preferences.includes(id)) {
            setPreferences(preferences.filter(p => p !== id));
        } else {
            setPreferences([...preferences, id]);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 relative overflow-hidden"
                >
                    {/* Background Blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-venuz-pink/20 rounded-full blur-3xl -z-10" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-venuz-blue/20 rounded-full blur-3xl -z-10" />

                    <h2 className="text-3xl font-display font-bold text-white mb-2">
                        Bienvenido a VENUZ
                    </h2>
                    <p className="text-gray-400 mb-8">
                        Personaliza tu experiencia. ¿Qué buscas hoy?
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-8">
                        <OptionButton
                            id="party"
                            label="Fiesta / Club"
                            icon={PartyPopper}
                            selected={preferences.includes('party')}
                            onClick={() => togglePreference('party')}
                        />
                        <OptionButton
                            id="relax"
                            label="Relax / Lounge"
                            icon={Coffee}
                            selected={preferences.includes('relax')}
                            onClick={() => togglePreference('relax')}
                        />
                        <OptionButton
                            id="adult"
                            label="Adult Fun"
                            icon={Heart}
                            selected={preferences.includes('adult')}
                            onClick={() => togglePreference('adult')}
                        />
                        <OptionButton
                            id="beach"
                            label="Playa / Nature"
                            icon={Sun}
                            selected={preferences.includes('beach')}
                            onClick={() => togglePreference('beach')}
                        />
                    </div>

                    <button
                        onClick={handleComplete}
                        className="w-full py-4 bg-gradient-to-r from-venuz-pink to-venuz-red rounded-xl font-bold text-white shadow-lg shadow-venuz-pink/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        Comenzar Exploración
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function OptionButton({ id, label, icon: Icon, selected, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300",
                selected
                    ? "bg-white/10 border-venuz-pink text-white ring-1 ring-venuz-pink"
                    : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
            )}
        >
            <Icon className={clsx("w-8 h-8", selected ? "text-venuz-pink" : "text-gray-500")} />
            <span className="text-sm font-medium">{label}</span>
        </button>
    );
}
