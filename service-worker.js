
'use strict';

//Add list of files to cache 
const FILES_TO_CACHE = [
    './',
    './index.html',
    './js/index.js',
    './css/index.css',
    'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap'
]

const CACHE_NAME = 'pages-cache-v1';
const DATA_CACHE_NAME = 'data-cache-v1';

self.addEventListener('install', event => {
    console.log('Service worker installing...');
    //Add a call to skipWaiting here
    self.skipWaiting();

    //Precahe static resources
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[ServiceWorker] Pre-caching offline page');
            return cache.addAll(FILES_TO_CACHE);
        }) 
    );
});

self.addEventListener('activate', event => {
    console.log('Service worker activating...');

    self.clients.claim();

    //Remove previous cached data from disk.
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
});

self.addEventListener('fetch', event => {
    //console.log('Fetching', event);
    //console.log('Fetching', event.request.url);

    if (event.request.url.includes('https://api.openweathermap.org/data/2.5/')) {
        console.log('[Service Worker] Fetch (data)', event.request.url);
        event.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(event.request)
                    .then(response => {
                        // If the response was good, clone it and store it in the cache.
                        if (response === 200) {
                            cache.put(evt.request.url, response.clone());
                        }
                        return response;
                    }).catch((err) => {
                        // Network request failed, try to get it from the cache.
                        return cache.match(event.request);
                    })
            }));
        return;
    }
    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            });
        })
    );
});


