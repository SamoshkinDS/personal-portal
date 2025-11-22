/* eslint-disable no-restricted-globals */
// Basic Service Worker for push notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Personal Portal';
    const body = data.body || 'Новое событие';
    const url = data.url || '/';
    const options = {
      body,
      data: { url },
      icon: '/icon-512.svg',
      badge: '/icon-512.svg',
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    // ignore
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification && event.notification.data && event.notification.data.url) || '/';
  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of allClients) {
      try {
        const c = client;
        if ('focus' in c) await c.focus();
        if ('navigate' in c) await c.navigate(url);
        return;
      } catch {}
    }
    await clients.openWindow(url);
  })());
});

