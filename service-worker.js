const CACHE_NAME = 'gamehub-v2';
const ASSETS = [
    './',
    './index.html',
    './blockspiel.html',
    './minigolf.html',
    './memory.html',
    './mahjong.html',
    './solitaer.html',
    './css/style.css',
    './css/minigolf.css',
    './js/game.js',
    './js/minigolf.js',
    './manifest.json',
    './assets/icons/icon-192.svg',
    './assets/icons/icon-512.svg'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Network-first: immer frische Dateien holen, Cache nur als Fallback (offline)
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
