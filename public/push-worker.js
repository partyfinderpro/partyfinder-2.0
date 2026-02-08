// public/push-worker.js
// Worker específico para notificaciones Push de VENUZ

self.addEventListener('push', function (event) {
    if (!event.data) {
        console.log('Push event but no data');
        return;
    }

    try {
        const data = event.data.json();
        console.log('Push data received:', data);

        const title = data.title || 'VENUZ';
        const options = {
            body: data.body || 'Nuevo evento disponible',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-96x96.png',
            image: data.image,
            data: {
                url: data.url || '/',
                timestamp: Date.now()
            },
            vibrate: [100, 50, 100],
            actions: data.actions || [
                {
                    action: 'open',
                    title: 'Ver ahora'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    } catch (err) {
        console.error('Error processing push event:', err);
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    let clickUrl = '/';
    if (event.notification.data && event.notification.data.url) {
        clickUrl = event.notification.data.url;
    }

    if (event.action === 'close') {
        return;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function (clientList) {
                // Si ya hay una ventana abierta, enfocarla y navegar
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url === clickUrl && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Si no, abrir una nueva
                if (clients.openWindow) {
                    return clients.openWindow(clickUrl);
                }
            })
    );
});
