
// register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then((event) => console.log('Service worker successfully registered'))
        .catch((err) => console.warn('Service worker cannot be registered due to: ', err));

    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.type === 'reviewsPosted') {
            fetchReviewsFromURL();
        }
        if (event.data.type === 'favoritesModified') {
            RenderHelper.updateFavoriteIcon(event.data.restaurant);
        }
    });
}
