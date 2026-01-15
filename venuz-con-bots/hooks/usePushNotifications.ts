'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface UsePushNotificationsReturn {
    isSupported: boolean;
    isSubscribed: boolean;
    permission: NotificationPermission;
    requestPermission: () => Promise<boolean>;
    subscribe: () => Promise<boolean>;
    unsubscribe: () => Promise<boolean>;
    loading: boolean;
    error: string | null;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications(): UsePushNotificationsReturn {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id || null);
        }
        init();
    }, []);

    useEffect(() => {
        const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        setIsSupported(supported);

        if (supported) {
            setPermission(Notification.permission);
            checkSubscription();
        }
    }, []);

    const checkSubscription = useCallback(async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(subscription !== null);
        } catch (err) {
            console.error('Error checking subscription:', err);
        }
    }, []);

    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!isSupported) {
            setError('Push notifications no soportadas');
            return false;
        }
        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result === 'granted';
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    }, [isSupported]);

    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!userId || !isSupported) return false;

        setLoading(true);
        setError(null);

        try {
            if (permission !== 'granted') {
                const granted = await requestPermission();
                if (!granted) throw new Error('Permiso denegado');
            }

            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            const subscriptionJson = subscription.toJSON();

            const { error: dbError } = await supabase
                .from('push_subscriptions')
                .upsert({
                    user_id: userId,
                    endpoint: subscriptionJson.endpoint!,
                    p256dh: subscriptionJson.keys!.p256dh!,
                    auth: subscriptionJson.keys!.auth!,
                    user_agent: navigator.userAgent,
                }, { onConflict: 'endpoint' });

            if (dbError) throw dbError;

            setIsSubscribed(true);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, [userId, isSupported, permission, requestPermission]);

    const unsubscribe = useCallback(async (): Promise<boolean> => {
        if (!userId) return false;

        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
                const subscriptionJson = subscription.toJSON();
                await supabase.from('push_subscriptions').delete().eq('endpoint', subscriptionJson.endpoint!);
            }

            setIsSubscribed(false);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, [userId]);

    return { isSupported, isSubscribed, permission, requestPermission, subscribe, unsubscribe, loading, error };
}
