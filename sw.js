importScripts('vendor/idb.min.js');
importScripts('js/dbhelper.js');

const CACHE = 'mws-restaurant-v1';
const STATIC_ASSETS = [
  '/',
  '/css/styles.css',
  '/js/index.js',
  '/js/dbhelper.js',
  '/js/renderhelper.js',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/vendor/lozad.min.js',
  '/vendor/idb.min.js',
  '/restaurant.html',
  '/img/1.jpg',
  '/img/2.jpg',
  '/img/3.jpg',
  '/img/4.jpg',
  '/img/5.jpg',
  '/img/6.jpg',
  '/img/7.jpg',
  '/img/8.jpg',
  '/img/9.jpg',
  '/img/10.jpg',
  '/img/icon-restaurant-128.png',
  '/img/icon-restaurant-512.png',
  '/img/placeholder.png',
  '/favicon.ico',
  '/manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .catch(err =>
        console.warn('Static assets cannot be added to cache: ', err)
      )
      .then(self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(cacheName => (
              cacheName.startsWith('mws-restaurant-') && CACHE !== cacheName
            ))
            .map(cacheName => caches.delete(cacheName))
        )
      )
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(response => {
      return !!response
        ? response
        : fetch(event.request)
          .then(resp => {
            caches.open(CACHE)
              .then(cache => cache.put(event.request.url, resp.clone()))
              .catch(error => `Failed to save request`);
            return resp;
          })
          .catch(err => console.warn('Fetching has fas failed: ', err));
    })
  );
});

self.addEventListener('sync', event => {
  console.log('sync event received:', event.tag);
  if (event.tag == 'reviewSubmission') {
    event.waitUntil(DBHelper.getReviewsForSync()
      .then(reviews => {
        return Promise.all(
          reviews.map(review => {
            return DBHelper.postReview(review)
              .then(e => DBHelper.deleteAfterSync('reviewSyncStore', review.id))
          }))
          .then(e => {
            self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
              clients.forEach(client => client.postMessage({ type: 'reviewsPosted' }));
            });
          })
      }));
  }
  if (event.tag == 'modifyFavorites') {
    event.waitUntil(DBHelper.getFavoritesForSync()
      .then(restaurants => {
        return Promise.all(
          restaurants.map(restaurant => {
            return DBHelper.modifyFavorites(restaurant)
              .then(e => {
                self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
                  clients.forEach(client => client.postMessage({ type: 'favoritesModified', restaurant }))
                })
              })
              .then(e => DBHelper.deleteAfterSync('favoritesSyncStore', restaurant.id))
          })
        );
      })
    )
  }
})