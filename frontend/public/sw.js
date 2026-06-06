const CACHE_NAME = 'minibar-cache-v2';
const STATIC_CACHE = 'minibar-static-v2';
const API_CACHE = 'minibar-api-v2';

const STATIC_URLS = [
  '/',
  '/index.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((names) =>
        Promise.all(names.map((name) => {
          if (![STATIC_CACHE, API_CACHE].includes(name)) return caches.delete(name);
        }))
      ),
      self.clients.claim(),
    ])
  );
});

function isAuthRequest(url) {
  return url.pathname.startsWith('/api/auth/');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (isAuthRequest(url)) {
    return;
  }

  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
    const pendingRequest = request.clone();
    event.respondWith(
      fetch(request).catch(() => {
        return savePending(pendingRequest).then(() => {
          return new Response(JSON.stringify({ queued: true, offline: true }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' },
          });
        });
      })
    );
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          if (response.ok) {
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return new Response(JSON.stringify({ offline: true, cached: false }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            });
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        if (response && response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

async function savePending(request) {
  const db = await openDB();
  const tx = db.transaction('pending', 'readwrite');
  const store = tx.objectStore('pending');
  const body = await request.clone().text();
  store.add({
    id: Date.now() + '-' + Math.random().toString(36).slice(2),
    url: request.url,
    method: request.method,
    headers: [...request.headers.entries()],
    body,
    timestamp: Date.now(),
  });
  return tx.done;
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending') {
    event.waitUntil(syncPending());
  }
});

async function syncPending() {
  const db = await openDB();
  const tx = db.transaction('pending', 'readonly');
  const store = tx.objectStore('pending');
  const all = await store.getAll();
  for (const item of all) {
    try {
      await fetch(item.url, {
        method: item.method,
        headers: Object.fromEntries(item.headers),
        body: item.body,
      });
      const deleteTx = db.transaction('pending', 'readwrite');
      deleteTx.objectStore('pending').delete(item.id);
      await deleteTx.done;
    } catch (e) {
      console.error('Sync failed for', item.url, e);
    }
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('MinibarOffline', 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('pending', { keyPath: 'id' });
      req.result.createObjectStore('cachedResponses', { keyPath: 'url' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SYNC_NOW') {
    syncPending().then(() => {
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SYNC_DONE' }));
      });
    });
  }
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});