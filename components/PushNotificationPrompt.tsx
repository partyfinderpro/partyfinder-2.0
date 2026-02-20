'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// ============================================================
// VENUZ Smart Notification Prompt
// Filosofía: NO interrumpir al usuario nuevo.
// Solo aparece cuando el usuario YA demostró interés real:
//   ✅ 3+ interacciones (likes, clicks, shares)
//   ✅ 5+ minutos en el sitio
// ============================================================

const MIN_INTERACTIONS = 3;   // Mínimo likes/clicks para mostrar
const MIN_TIME_MS = 5 * 60 * 1000; // 5 minutos en el sitio

// Evento global para que cualquier componente notifique interacciones
const INTERACTION_EVENT = 'venuz:user_interaction';

export function notifyUserInteraction() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(INTERACTION_EVENT));
    }
}

export function PushNotificationPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const interactionCount = useRef(0);
    const startTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Si ya nos dieron permiso o rechazaron, no molestar nunca más
        const permission = 'Notification' in window ? Notification.permission : 'denied';
        const seen = localStorage.getItem('venuz_push_prompt_seen');
        if (permission === 'granted' || permission === 'denied' || seen) return;

        // Start tracking time
        startTimeRef.current = Date.now();

        const checkConditions = () => {
            const timeOnSite = Date.now() - startTimeRef.current;
            const enoughTime = timeOnSite >= MIN_TIME_MS;
            const enoughInteractions = interactionCount.current >= MIN_INTERACTIONS;

            if (enoughTime && enoughInteractions && !dismissed) {
                setShowPrompt(true);
            }
        };

        const handleInteraction = () => {
            interactionCount.current += 1;
            checkConditions();
        };

        // Escuchar interacciones desde FeedCardDynamic
        window.addEventListener(INTERACTION_EVENT, handleInteraction);

        // También escuchar clicks en el feed como señal de interés
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Solo contar clicks en botones de like, share o links del feed
            if (target.closest('button') || target.closest('article')) {
                interactionCount.current += 1;
                checkConditions();
            }
        };
        window.addEventListener('click', handleClick, { passive: true });

        // Timer para verificar cada 30s si ya cumplió el tiempo
        const interval = setInterval(checkConditions, 30_000);

        return () => {
            window.removeEventListener(INTERACTION_EVENT, handleInteraction);
            window.removeEventListener('click', handleClick);
            clearInterval(interval);
        };
    }, [dismissed]);

    const handleActivate = async () => {
        if (!('Notification' in window)) return;

        try {
            const result = await Notification.requestPermission();
            if (result === 'granted') {
                // Intentar suscripción push (solo si hay VAPID key)
                const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (vapidKey && 'serviceWorker' in navigator) {
                    try {
                        const registration = await navigator.serviceWorker.ready;
                        await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: vapidKey,
                        });
                    } catch {
                        // Silently ignore si falla la suscripción push
                    }
                }
            }
        } catch {
            // Silently ignore permission request errors
        } finally {
            localStorage.setItem('venuz_push_prompt_seen', 'true');
            setShowPrompt(false);
            setDismissed(true);
        }
    };

    const handleDismiss = () => {
        localStorage.setItem('venuz_push_prompt_seen', 'true');
        setShowPrompt(false);
        setDismissed(true);
    };

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ y: 120, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 120, opacity: 0 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="fixed bottom-6 left-4 right-4 z-50 md:left-auto md:right-6 md:w-80"
                >
                    <div className="relative bg-black/90 backdrop-blur-xl border border-purple-500/40 rounded-2xl p-4 shadow-2xl shadow-purple-900/40 overflow-hidden">
                        {/* Glow accent */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />

                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
                                <Bell className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold text-sm leading-tight mb-1">
                                    ¿Te gusta lo que ves? 🔥
                                </p>
                                <p className="text-gray-400 text-xs leading-relaxed mb-3">
                                    Activa alertas y te avisamos cuando llegue nuevo contenido de tu zona.
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleDismiss}
                                        className="text-gray-500 hover:text-gray-300 text-xs transition-colors py-1"
                                    >
                                        Ahora no
                                    </button>
                                    <button
                                        onClick={handleActivate}
                                        className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all active:scale-95 shadow-lg shadow-purple-900/40"
                                    >
                                        Sí, activar 🔔
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
