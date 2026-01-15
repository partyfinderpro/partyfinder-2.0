'use client';

import { useNotifications } from '@/hooks/useNotifications';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function NotificationsPage() {
    const [user, setUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const { notifications, markAsRead, markAllAsRead, loading } = useNotifications();

    useEffect(() => {
        async function checkAuth() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setAuthLoading(false);
        }
        checkAuth();
    }, []);

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'favorite': return '❤️';
            case 'new_content': return '✨';
            case 'event_reminder': return '🔔';
            case 'system': return '⚙️';
            default: return '📬';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return `Hoy ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffDays === 1) {
            return `Ayer ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffDays < 7) {
            return `Hace ${diffDays} días`;
        } else {
            return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto mb-4"></div>
                    <p className="text-pink-400">Cargando notificaciones...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-md"
                >
                    <div className="text-6xl mb-4">🔒</div>
                    <h1 className="text-3xl font-bold text-white mb-3">
                        Inicia sesión
                    </h1>
                    <p className="text-gray-400 mb-8">
                        Inicia sesión para ver tus notificaciones
                    </p>
                    <Link
                        href="/"
                        className="inline-block bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8 py-4 rounded-full font-semibold transition-all transform hover:scale-105"
                    >
                        Volver al inicio
                    </Link>
                </motion.div>
            </div>
        );
    }

    const unreadNotifications = notifications.filter(n => !n.read);

    return (
        <div className="min-h-screen bg-black pb-20">
            {/* Header */}
            <header className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-10 sticky top-0 z-10 shadow-lg">
                <div className="max-w-4xl mx-auto">
                    <Link href="/" className="text-pink-200 hover:text-white mb-4 inline-block">
                        ← Volver
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                                🔔 Notificaciones
                            </h1>
                            <p className="text-pink-100 mt-2">
                                {unreadNotifications.length > 0
                                    ? `${unreadNotifications.length} ${unreadNotifications.length === 1 ? 'nueva' : 'nuevas'}`
                                    : 'Todas leídas'
                                }
                            </p>
                        </div>

                        {unreadNotifications.length > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                            >
                                Marcar todas
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                {notifications.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-20"
                    >
                        <div className="text-8xl mb-6">📭</div>
                        <h2 className="text-3xl font-bold text-white mb-3">
                            No tienes notificaciones
                        </h2>
                        <p className="text-gray-400 text-lg">
                            Cuando tengas novedades, aparecerán aquí
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notif, index) => (
                            <motion.div
                                key={notif.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => !notif.read && markAsRead(notif.id)}
                                className={`
                  p-5 rounded-2xl cursor-pointer transition-all
                  ${notif.read
                                        ? 'bg-gray-900 border border-gray-800'
                                        : 'bg-gradient-to-r from-pink-900/20 to-purple-900/20 border border-pink-500/30 hover:border-pink-500/50'
                                    }
                `}
                            >
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 text-4xl">
                                        {getNotificationIcon(notif.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h3 className="text-white font-bold text-lg">
                                                {notif.title}
                                            </h3>
                                            {!notif.read && (
                                                <div className="flex-shrink-0 w-3 h-3 bg-pink-500 rounded-full animate-pulse" />
                                            )}
                                        </div>

                                        <p className="text-gray-300 mb-3">
                                            {notif.message}
                                        </p>

                                        <p className="text-gray-500 text-sm">
                                            {formatDate(notif.created_at)}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
