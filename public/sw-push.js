// Push Notification Service Worker

self.addEventListener('install', (event) => {
  console.log('[SW Push] Installing service worker...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW Push] Activating service worker...');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[SW Push] Push received:', event);
  
  if (!event.data) {
    console.log('[SW Push] No data in push event');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'Nova Mensagem',
      body: event.data.text(),
      icon: '/icon-192x192.png'
    };
  }

  const title = data.title || 'MagicTalk';
  const options = {
    body: data.body || 'Você tem uma nova mensagem',
    icon: data.icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      type: data.type,
      conversationId: data.conversationId,
      location: data.location
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ],
    tag: data.tag || 'magictalk-notification',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW Push] Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already an open window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          // Navigate to the specific page
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            data: event.notification.data
          });
          return;
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
