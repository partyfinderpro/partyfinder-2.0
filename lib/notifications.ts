// lib/notifications.ts
// Sistema de notificaciones push para PWA
// Código de Grok

'use client';

/**
 * Verifica si las notificaciones push están soportadas
 */
export function isPushSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'Notification' in window &&
        'serviceWorker' in navigator &&
        'PushManager' in window;
}

/**
 * Solicita permiso para enviar notificaciones
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (!isPushSupported()) {
        console.warn('[Notifications] Push notifications no soportadas en este navegador');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission === 'denied') {
        console.warn('[Notifications] El usuario ha bloqueado las notificaciones');
        return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

/**
 * Convierte VAPID public key a formato Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

/**
 * Suscribe al usuario a notificaciones push
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
    const permission = await requestNotificationPermission();
    if (!permission) {
        console.warn('[Notifications] No se obtuvo permiso para notificaciones');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.ready;

        // Verificar si ya hay una suscripción
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

            if (!vapidPublicKey) {
                console.error('[Notifications] VAPID_PUBLIC_KEY no configurada');
                return null;
            }

            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
            });
        }

        // Enviar subscription al servidor para guardarla
        await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription),
        });

        console.log('[Notifications] Suscrito a push notifications');
        return subscription;

    } catch (error) {
        console.error('[Notifications] Error al suscribirse:', error);
        return null;
    }
}

/**
 * Cancela la suscripción a notificaciones push
 */
export async function unsubscribeFromPush(): Promise<boolean> {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();

            // Notificar al servidor
            await fetch('/api/push/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: subscription.endpoint }),
            });

            console.log('[Notifications] Desuscrito de push notifications');
            return true;
        }

        return false;
    } catch (error) {
        console.error('[Notifications] Error al desuscribirse:', error);
        return false;
    }
}

/**
 * Muestra una notificación local (sin push server)
 */
export async function showLocalNotification(
    title: string,
    options?: NotificationOptions
): Promise<void> {
    const permission = await requestNotificationPermission();
    if (!permission) return;

    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options,
    });
}

/**
 * Hook-friendly: Estado de las notificaciones
 */
export function getNotificationStatus(): {
    supported: boolean;
    permission: NotificationPermission | 'unsupported';
} {
    if (!isPushSupported()) {
        return { supported: false, permission: 'unsupported' };
    }

    return {
        supported: true,
        permission: Notification.permission,
    };
}
