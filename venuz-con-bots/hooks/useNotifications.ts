'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'favorite' | 'new_content' | 'event_reminder' | 'system';
    content_id: string | null;
    read: boolean;
    created_at: string;
}

interface UseNotificationsReturn {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    // Obtener usuario
    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id || null);
        }
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUserId(session?.user?.id || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Cargar notificaciones
    const loadNotifications = useCallback(async () => {
        if (!userId) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const { data: notifData, error: notifError } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (notifError) throw notifError;

            setNotifications(notifData || []);
            setUnreadCount(notifData?.filter(n => !n.read).length || 0);
        } catch (err: any) {
            console.error('Error cargando notificaciones:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Cargar al montar
    useEffect(() => {
        loadNotifications();

        // Suscribirse a cambios en tiempo real
        if (userId) {
            const channel = supabase
                .channel('notifications_changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${userId}`,
                    },
                    () => {
                        loadNotifications();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [userId, loadNotifications]);

    // Marcar como leída
    const markAsRead = useCallback(async (notificationId: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId);

            if (error) throw error;
        } catch (err: any) {
            console.error('Error marcando como leída:', err);
            await loadNotifications();
        }
    }, [loadNotifications]);

    // Marcar todas como leídas
    const markAllAsRead = useCallback(async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', userId)
                .eq('read', false);

            if (error) throw error;
        } catch (err: any) {
            console.error('Error marcando todas como leídas:', err);
            await loadNotifications();
        }
    }, [userId, loadNotifications]);

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        loading,
        error,
        refresh: loadNotifications,
    };
}
