'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import Link from 'next/link';

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'favorite': return '❤️';
            case 'new_content': return '✨';
            case 'event_reminder': return '🔔';
            case 'system': return '⚙️';
            default: return '📬';
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Hace un momento';
        if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)}h`;
        if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)}d`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Notificaciones"
            >
                <motion.div
                    animate={unreadCount > 0 ? {
                        rotate: [0, -20, 20, -20, 20, 0],
                    } : {}}
                    transition={{ duration: 0.5, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 5 }}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </motion.div>

                {/* Badge */}
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.div>
                    )}
                </AnimatePresence>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-gray-900 rounded-2xl shadow-2xl border border-pink-500/30 overflow-hidden z-[100]"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-3 flex items-center justify-between">
                            <h3 className="text-white font-semibold">Notificaciones</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-pink-100 hover:text-white transition-colors"
                                >
                                    Marcar todas como leídas
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500 mx-auto"></div>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="text-4xl mb-2">📭</div>
                                    <p className="text-gray-400">No tienes notificaciones</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-800">
                                    {notifications.slice(0, 10).map((notif) => (
                                        <motion.div
                                            key={notif.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className={`
                        p-4 cursor-pointer transition-colors
                        ${notif.read ? 'bg-gray-900' : 'bg-gray-800/50'}
                        hover:bg-gray-800
                      `}
                                            onClick={() => {
                                                if (!notif.read) {
                                                    markAsRead(notif.id);
                                                }
                                                setIsOpen(false);
                                            }}
                                        >
                                            <div className="flex gap-3">
                                                <div className="flex-shrink-0 text-2xl">
                                                    {getNotificationIcon(notif.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-semibold text-sm mb-1">
                                                        {notif.title}
                                                    </p>
                                                    <p className="text-gray-400 text-xs line-clamp-2 mb-2">
                                                        {notif.message}
                                                    </p>
                                                    <p className="text-gray-500 text-xs">
                                                        {formatTimeAgo(notif.created_at)}
                                                    </p>
                                                </div>
                                                {!notif.read && (
                                                    <div className="flex-shrink-0">
                                                        <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="bg-gray-800 px-4 py-3 text-center border-t border-gray-700">
                                <Link
                                    href="/notifications"
                                    className="text-sm text-pink-400 hover:text-pink-300 transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Ver todas las notificaciones
                                </Link>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
