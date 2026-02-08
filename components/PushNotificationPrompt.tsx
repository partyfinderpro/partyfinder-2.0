'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Helper para convertir la VAPID key
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function PushNotificationPrompt() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [loading, setLoading] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);

            // Mostrar prompt si no se ha preguntado o si el usuario cerró el prompt antes
            // (podríamos usar localStorage para no molestar demasiado)
            const hasSeenPrompt = localStorage.getItem('venuz_push_prompt_seen');
            if (Notification.permission === 'default' && !hasSeenPrompt) {
                // Esperar un poco antes de mostrar para no ser intrusivos
                const timer = setTimeout(() => setShowPrompt(true), 5000);
                return () => clearTimeout(timer);
            }
        }
    }, []);

    const subscribeToPush = async () => {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
                ),
            });

            // Enviar suscripción al backend
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sub),
            });

            setPermission('granted');
            setShowPrompt(false);
            console.log('[Push] Subscribed successfully!');
        } catch (error) {
            console.error('[Push] Subscribe error:', error);
            // Si el usuario deniega, guardar preferencia
            if (Notification.permission === 'denied') {
                setPermission('denied');
                localStorage.setItem('venuz_push_prompt_seen', 'true');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('venuz_push_prompt_seen', 'true');
    };

    if (!showPrompt || permission === 'granted' || permission === 'denied') {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-8 md:w-96"
            >
                <div className="bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 border border-purple-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-purple-500/20 rounded-full text-purple-400">
                            <Bell className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-white mb-1">
                                Activa notificaciones
                            </h3>
                            <p className="text-sm text-gray-300 mb-4">
                                Recibe alertas de eventos cercanos y promociones exclusivas en tiempo real.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDismiss}
                                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                                >
                                    Después
                                </button>
                                <button
                                    onClick={subscribeToPush}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        'Activar ahora'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
