// components/NotificationBell.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning';
    read: boolean;
    created_at: string;
    content_id?: string;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        loadNotifications();
        const unsubscribe = subscribeToNotifications();
        return () => { unsubscribe?.(); };
    }, []);

    const loadNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.read).length);
        }
    };

    const subscribeToNotifications = () => {
        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                },
                (payload) => {
                    setNotifications(prev => [payload.new as Notification, ...prev]);
                    setUnreadCount(prev => prev + 1);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const markAsRead = async (notificationId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);

        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false);

        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-white/10 rounded-full transition-colors"
            >
                <Bell className="w-6 h-6 text-white" />

                {unreadCount > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-venuz-pink rounded-full w-5 h-5 flex items-center justify-center"
                    >
                        <span className="text-xs text-white font-bold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </motion.div>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 mt-2 w-80 md:w-96 max-h-[500px] overflow-y-auto bg-black/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl z-50"
                        >
                            {/* Header */}
                            <div className="sticky top-0 bg-black/95 p-4 border-b border-white/10 flex items-center justify-between">
                                <h3 className="font-bold text-white">Notificaciones</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-venuz-pink hover:underline"
                                    >
                                        Marcar todas como leídas
                                    </button>
                                )}
                            </div>

                            {/* Notifications List */}
                            <div className="divide-y divide-white/10">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-white/50">
                                        No tienes notificaciones
                                    </div>
                                ) : (
                                    notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            onClick={() => markAsRead(notification.id)}
                                            className={`p-4 hover:bg-white/5 cursor-pointer transition-colors ${!notification.read ? 'bg-venuz-pink/10' : ''
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-white mb-1">
                                                        {notification.title}
                                                    </h4>
                                                    <p className="text-sm text-white/70">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-white/50 mt-2">
                                                        {new Date(notification.created_at).toLocaleString('es-MX')}
                                                    </p>
                                                </div>

                                                {!notification.read && (
                                                    <div className="w-2 h-2 bg-venuz-pink rounded-full mt-2" />
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
