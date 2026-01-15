// components/InstallPrompt.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Detectar iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setIsIOS(isIOSDevice);

        // Verificar si ya está instalada
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        if (isStandalone) return;

        // Verificar si ya se descartó recientemente
        const dismissed = localStorage.getItem('venuz_install_dismissed');
        if (dismissed) {
            const dismissedAt = new Date(dismissed);
            const hoursSince = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60);
            if (hoursSince < 24) return; // No mostrar por 24 horas
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Mostrar después de 5 segundos
            setTimeout(() => setShowPrompt(true), 5000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // En iOS, mostrar instrucciones después de un delay
        if (isIOSDevice) {
            setTimeout(() => setShowPrompt(true), 8000);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        console.log(`User response: ${outcome}`);
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        localStorage.setItem('venuz_install_dismissed', new Date().toISOString());
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100]"
            >
                <div className="bg-gradient-to-r from-venuz-pink to-purple-600 p-4 rounded-2xl shadow-2xl border border-white/20">
                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-2 right-2 p-1 text-white/70 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-start gap-4">
                        <div className="text-4xl">📱</div>
                        <div className="flex-1">
                            <h3 className="font-bold text-white mb-1">Instala VENUZ</h3>
                            <p className="text-sm text-white/90">
                                {isIOS
                                    ? 'Toca el botón compartir y luego "Agregar a Inicio"'
                                    : 'Accede más rápido desde tu pantalla de inicio'
                                }
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        {!isIOS && deferredPrompt && (
                            <button
                                onClick={handleInstall}
                                className="flex-1 bg-white text-venuz-pink font-semibold py-2 px-4 rounded-lg hover:bg-white/90 transition-all flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Instalar
                            </button>
                        )}
                        <button
                            onClick={handleDismiss}
                            className="px-4 py-2 text-white/70 hover:text-white transition-all"
                        >
                            Después
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
