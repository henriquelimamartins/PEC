const CACHE_NAME = 'pec-boleias-cache-v1';

// Ficheiros para guardar offline logo no primeiro carregamento
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  // Se tiveres as imagens na mesma pasta, podes descomentar:
  // './favicon.png',
  // './apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Ignora requisições a APIs externas (como a da Firebase) e foca apenas nos ficheiros locais
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retorna o que está em cache (offline), ou faz o pedido à net
        return response || fetch(event.request).then(fetchRes => {
          return caches.open(CACHE_NAME).then(cache => {
            // Guarda dinamicamente coisas novas que sejam abertas (fontes, etc)
            cache.put(event.request, fetchRes.clone());
            return fetchRes;
          });
        });
      }).catch(() => {
        // Se a net for abaixo e não tiver o ficheiro em cache, recai para o index.html
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});
