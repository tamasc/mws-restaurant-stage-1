self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open('mws-restaurant-v1')
      .then(cache => cache.addAll([
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
        '/img/10.jpg',
      ]))
      .catch(err => console.warn('Static assets cannot be added to cache: ', err))
      .then(self.skipWaiting())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches
      .match(event.request, { ignoreSearch: true })
      .then(response => {
        // console.log(response);
        return !!response ? response : fetch(event.request);
      })
  );
});
