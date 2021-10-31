// Module 19.4.5 assist in creating js file - (UCF)

// const APP_PREFIX = 'Tracker-';     

// const VERSION = 'version_01';

const CACHE_NAME = 'budget-cache-v1';

const DATA_CACHE_NAME = 'data-cache-v1';

const FILES_TO_CACHE = [

  "/",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./icons/icon-72x72.png",
  "./icons/icon-96x96.png",
  "./icons/icon-128x128.png",
  "./icons/icon-144x144.png",
  "./icons/icon-152x152.png",
  "./icons/icon-192x192.png",
  "./icons/icon-384x384.png",
  "./icons/icon-512x512.png",
  "./js/idbs.js",
  "./js/index.js"
];

// Install service worker

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Cached files successfully.');
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Delete old data from caches

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(keylist => {
      return Promise.all(key => {
        if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
          console.log('Deleting old cache', key);
          return caches.delete(key);
        }
      });
    })
  );
  self.clients.claim();
});

// Fetch request

self.addEventListener('fetch', function(event) {
    if (event.request.url.includes('/api/')) {
      event.respondWith(
        caches
          .open(DATA_CACHE_NAME)
          .then(cache => {
            return fetch(event.request)
              .then(response => {
                if (response.status === 200) {
                  cache.put(event.request.url, response.clone());
                }
                return response;
              })
              .catch(err => {
                return cache.match(event.request);
              });
          })
          .catch(err => console.log(err))
      );
      return;
    }
  
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match(event.request).then(function(response) {
          if (response) {
            return response;
          } else if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/');
          }
        });
      })
    );
});
