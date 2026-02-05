"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Sparkles } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (typeof window === 'undefined') return;

        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
            return;
        }

        // --- THE HIGHWAY LOGIC: Only prompt engaged users ---

        // 1. Visit Counter
        let visits = 0;
        try {
            const storedVisits = localStorage.getItem('venuz_visit_count');
            visits = storedVisits ? parseInt(storedVisits) : 0;
            // Note: Visit incrementing happens elsewhere (e.g. session start), or we can do it here if "visited" implies loaded this component multiple times across sessions.
            // For safety, let's increment a session flag so we don't spam-increment on refresh
            if (!sessionStorage.getItem('venuz_session_counted')) {
                visits++;
                localStorage.setItem('venuz_visit_count', visits.toString());
                sessionStorage.setItem('venuz_session_counted', 'true');
            }
        } catch (e) { console.error('Storage error', e); }

        // 2. Interaction Check (from Highway)
        // Only true if user actually clicked Like
        const hasInteracted = localStorage.getItem('venuz_has_interacted') === 'true';

        // 3. Dismissal Check
        const wasDismissed = localStorage.getItem("venuz-pwa-dismissed");
        if (wasDismissed) {
            const dismissedAt = new Date(wasDismissed);
            const now = new Date();
            const daysSinceDismissed = (now.getTime() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) {
                setDismissed(true);
                return;
            }
        }

        // Listen for beforeinstallprompt
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // LOGIC GATE: Only show if visits >= 2 AND has interacted
            // (Or if debug forced)
            const isEngaged = visits >= 2 && hasInteracted;

            if (isEngaged) {
                // Show prompt after delay
                setTimeout(() => {
                    setShowPrompt(true);
                }, 5000);
            } else {
                console.log('PWA Prompt withheld: User not yet engaged (Visits:', visits, 'Interacted:', hasInteracted, ')');
            }
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstall);

        // Listen for app installed
        window.addEventListener("appinstalled", () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === "accepted") {
                setIsInstalled(true);
            }

            setDeferredPrompt(null);
            setShowPrompt(false);
        } catch (error) {
            console.error("Install error:", error);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        setDismissed(true);
        localStorage.setItem("venuz-pwa-dismissed", new Date().toISOString());
    };

    // Don't render if already installed, dismissed, or no prompt
    if (isInstalled || dismissed || !showPrompt) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm"
            >
                <div className="relative bg-black/95 backdrop-blur-xl rounded-3xl border border-pink-500/30 shadow-2xl shadow-pink-500/20 overflow-hidden">
                    {/* Gradient border effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-amber-500/20 opacity-50" />

                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors z-10"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="relative p-5">
                        {/* Header */}
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-500/30">
                                <Smartphone className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    Instala VENUZ
                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                </h3>
                                <p className="text-sm text-white/60 mt-0.5">
                                    Acceso rápido desde tu pantalla de inicio
                                </p>
                            </div>
                        </div>

                        {/* Benefits */}
                        <ul className="space-y-2 mb-5 text-sm">
                            <li className="flex items-center gap-2 text-white/70">
                                <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                                Notificaciones de eventos cerca de ti
                            </li>
                            <li className="flex items-center gap-2 text-white/70">
                                <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                                Funciona sin conexión
                            </li>
                            <li className="flex items-center gap-2 text-white/70">
                                <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                                Experiencia de app nativa
                            </li>
                        </ul>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleInstall}
                                className="
                  flex-1 flex items-center justify-center gap-2
                  py-3 px-4 rounded-xl
                  bg-gradient-to-r from-pink-500 to-rose-500
                  text-white font-semibold
                  hover:from-pink-600 hover:to-rose-600
                  transition-all duration-300
                  shadow-lg shadow-pink-500/30
                "
                            >
                                <Download className="w-5 h-5" />
                                Instalar
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="
                  py-3 px-4 rounded-xl
                  bg-white/10
                  text-white/70 font-medium
                  hover:bg-white/20
                  transition-colors
                "
                            >
                                Ahora no
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
