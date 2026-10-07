const CACHE_NAME = 'youbgram-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activation
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim()); // Take control immediately
});

self.addEventListener('fetch', (event) => {
  // Bypass for non-http/https and dev-specific resources
  if (!event.request.url.startsWith('http')) return;
  
  // Don't cache hot-module-reload files or dev-server specific assets
  if (event.request.url.includes('chrome-extension') || event.request.url.includes('@react-refresh')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      
      return fetch(event.request).catch(err => {
        // Only log actual network failures, ignore cancelled requests
        if (err.name !== 'AbortError') {
          console.warn('[SW] Network unreachable:', event.request.url);
        }
        return new Response('Network error', { status: 503 });
      });
    })
  );
});

// Push Notification Listener
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'YouBGram';
  const options = {
    body: data.body || 'You have a new notification!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: {
        url: data.url || '/'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
