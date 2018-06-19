const CACHE = 'mws-restaurant-v1';
const STATIC_ASSETS = [
  '/',
  '/css/styles.css',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/restaurant.html',
  '/data/restaurants.json',
  '/img/1.jpg',
  '/img/2.jpg',
  '/img/3.jpg',
  '/img/4.jpg',
  '/img/5.jpg',
  '/img/6.jpg',
  '/img/7.jpg',
  '/img/8.jpg',
  '/img/9.jpg',
  '/img/10.jpg'
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
            .filter(cacheName => cacheName.startsWith('mws-restaurant-'))
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
              caches.open(CACHE).then(cache => cache.put(storageUrl, resp.clone()));
              return resp;
            })
            .catch(err => console.warn('Fetching has fas failed: ', err));
    })
  );
});
