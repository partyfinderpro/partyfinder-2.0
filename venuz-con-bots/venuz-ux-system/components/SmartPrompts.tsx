'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Download, Crown, X, Sparkles } from 'lucide-react';

interface SmartPromptsProps {
    canShowGeoPrompt: boolean;
    canShowInstallPrompt: boolean;
    canShowPremiumPrompt: boolean;
    onGeoAccept: () => Promise<boolean>;
    onGeoDecline: () => void;
    onInstallAccept: () => void;
    onInstallDecline: () => void;
    onPremiumAccept: () => void;
    onPremiumDecline: () => void;
    nearbyCount?: number;
}

export function SmartPrompts({
    canShowGeoPrompt,
    canShowInstallPrompt,
    canShowPremiumPrompt,
    onGeoAccept,
    onGeoDecline,
    onInstallAccept,
    onInstallDecline,
    onPremiumAccept,
    onPremiumDecline,
    nearbyCount = 12,
}: SmartPromptsProps) {
    const [showGeo, setShowGeo] = useState(false);
    const [showInstall, setShowInstall] = useState(false);
    const [showPremium, setShowPremium] = useState(false);
    const [isLoadingGeo, setIsLoadingGeo] = useState(false);

    useEffect(() => {
        if (canShowGeoPrompt && !showInstall && !showPremium) {
            const timer = setTimeout(() => setShowGeo(true), 500);
            return () => clearTimeout(timer);
        }
    }, [canShowGeoPrompt, showInstall, showPremium]);

    useEffect(() => {
        if (canShowInstallPrompt && !showGeo && !showPremium) {
            const timer = setTimeout(() => setShowInstall(true), 500);
            return () => clearTimeout(timer);
        }
    }, [canShowInstallPrompt, showGeo, showPremium]);

    useEffect(() => {
        if (canShowPremiumPrompt && !showGeo && !showInstall) {
            const timer = setTimeout(() => setShowPremium(true), 500);
            return () => clearTimeout(timer);
        }
    }, [canShowPremiumPrompt, showGeo, showInstall]);

    const handleGeoAccept = async () => {
        setIsLoadingGeo(true);
        await onGeoAccept();
        setIsLoadingGeo(false);
        setShowGeo(false);
    };

    const handleGeoDecline = () => {
        onGeoDecline();
        setShowGeo(false);
    };

    const handleInstallAccept = () => {
        onInstallAccept();
        setShowInstall(false);
    };

    const handleInstallDecline = () => {
        onInstallDecline();
        setShowInstall(false);
    };

    const handlePremiumAccept = () => {
        onPremiumAccept();
        setShowPremium(false);
    };

    const handlePremiumDecline = () => {
        onPremiumDecline();
        setShowPremium(false);
    };

    return (
        <>
            {/* GEOLOCATION PROMPT */}
            <AnimatePresence>
                {showGeo && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
                    >
                        <div className="bg-gradient-to-br from-gray-900 to-black border border-pink-500/30 rounded-2xl p-5 shadow-2xl shadow-pink-500/20">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                                        <MapPin className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">
                                            ¿Qué hay cerca de ti?
                                        </h3>
                                        <p className="text-pink-400 text-sm">
                                            {nearbyCount}+ lugares esperándote
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleGeoDecline}
                                    className="text-gray-500 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-gray-300 text-sm mb-4">
                                Activa tu ubicación para descubrir los mejores lugares a minutos de donde estás.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleGeoDecline}
                                    className="flex-1 py-3 px-4 rounded-xl bg-gray-800 text-gray-300 font-medium hover:bg-gray-700 transition-colors"
                                >
                                    Ahora no
                                </button>
                                <button
                                    onClick={handleGeoAccept}
                                    disabled={isLoadingGeo}
                                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isLoadingGeo ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <MapPin className="w-4 h-4" />
                                            Activar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* INSTALL PROMPT */}
            <AnimatePresence>
                {showInstall && (
                    <motion.div
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 100, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-4 right-4 z-50 w-80"
                    >
                        <div className="bg-gradient-to-br from-purple-900 to-black border border-purple-500/30 rounded-2xl p-4 shadow-2xl shadow-purple-500/20">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                                    <Download className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-bold">Instala VENUZ</h3>
                                    <p className="text-purple-300 text-xs">
                                        Acceso rápido desde tu pantalla
                                    </p>
                                </div>
                                <button
                                    onClick={handleInstallDecline}
                                    className="text-gray-500 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleInstallDecline}
                                    className="flex-1 py-2 px-3 rounded-lg text-gray-400 text-sm hover:text-white transition-colors"
                                >
                                    Después
                                </button>
                                <button
                                    onClick={handleInstallAccept}
                                    className="flex-1 py-2 px-3 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition-colors flex items-center justify-center gap-1"
                                >
                                    <Download className="w-4 h-4" />
                                    Instalar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PREMIUM PROMPT */}
            <AnimatePresence>
                {showPremium && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                            onClick={handlePremiumDecline}
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[420px] z-50"
                        >
                            <div className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-black border border-yellow-500/30 rounded-3xl p-6 shadow-2xl h-full md:h-auto overflow-auto">
                                <button
                                    onClick={handlePremiumDecline}
                                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                <div className="flex justify-center mb-6">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                                        <Crown className="w-10 h-10 text-white" />
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold text-center text-white mb-2">
                                    ¡Te está gustando VENUZ!
                                </h2>
                                <p className="text-gray-400 text-center mb-6">
                                    Desbloquea todo el potencial
                                </p>

                                <div className="space-y-3 mb-6">
                                    {[
                                        { icon: '🗺️', text: 'Radio de búsqueda hasta 100km' },
                                        { icon: '⚡', text: '"Disponible Ahora" en tiempo real' },
                                        { icon: '💬', text: 'Contacto ilimitado por WhatsApp' },
                                        { icon: '⭐', text: 'Favoritos sin límite' },
                                        { icon: '🔔', text: 'Alertas de nuevos lugares' },
                                        { icon: '🚫', text: 'Sin publicidad' },
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3 text-gray-200">
                                            <span className="text-xl">{feature.icon}</span>
                                            <span>{feature.text}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-4 mb-6 text-center border border-yellow-500/30">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <Sparkles className="w-5 h-5 text-yellow-400" />
                                        <span className="text-yellow-400 font-medium">Oferta de lanzamiento</span>
                                    </div>
                                    <div className="text-4xl font-bold text-white">
                                        $4.99<span className="text-lg text-gray-400">/mes</span>
                                    </div>
                                    <p className="text-gray-400 text-sm mt-1">
                                        Cancela cuando quieras
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={handlePremiumAccept}
                                        className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold text-lg hover:from-yellow-400 hover:to-orange-400 transition-all shadow-lg shadow-yellow-500/30"
                                    >
                                        Hacerme Premium
                                    </button>
                                    <button
                                        onClick={handlePremiumDecline}
                                        className="w-full py-3 text-gray-400 hover:text-white transition-colors"
                                    >
                                        Seguir con versión gratuita
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

export default SmartPrompts;
