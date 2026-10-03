const CACHE_NAME = 'pec-boleias-v1'; // Sempre que quiseres forçar uma grande limpeza, muda para v2, v3, etc.

// Instalação: o Service Worker assume o controlo imediatamente sem esperar
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Ativação: Limpa caches antigas para libertar espaço
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceção dos pedidos: Estratégia "Network First" (Rede primeiro, Cache como plano B)
self.addEventListener('fetch', (event) => {
  // Ignorar pedidos que não sejam GET (ex: POST para o Firebase)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Se a rede funcionou e encontrou o ficheiro novo, atualiza o cache silenciosamente
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // Se a rede falhar (estás offline), devolve o que está guardado no cache
        return caches.match(event.request);
      })
  );
});