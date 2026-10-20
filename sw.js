// Boleias PEC - Service Worker
// Estratégia: NETWORK-FIRST. Vai sempre à rede buscar a versão mais recente
// (ignorando a cache HTTP do browser/GitHub Pages) e só usa a cache se estiveres offline.
const CACHE_NAME = 'pec-boleias-runtime-v3';

const CORE_FILES = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(
        // 'reload' garante que a pré-cache não vem da cache HTTP; falhas não bloqueiam a instalação
        CORE_FILES.map(url =>
          fetch(new Request(url, { cache: 'reload' }))
            .then(res => (res && res.ok) ? cache.put(url, res) : null)
            .catch(() => null)
        )
      ))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Só tratamos GET do mesmo domínio (Firebase, fontes, etc. seguem direto para a rede)
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req, { cache: 'no-store' })
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then(cached => {
          if (cached) return cached;
          if (req.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        })
      )
  );
});
