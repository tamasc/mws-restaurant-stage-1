
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

window.addEventListener('offline', e => {
    const notification = document.getElementById('statusNotification');
    notification.innerText = 'The application is offline!';
    notification.setAttribute('ariaHidden', false);

    notification.classList.add('offline');
});
window.addEventListener('online', e => {
    const notification = document.getElementById('statusNotification');
    notification.innerText = 'The application is online!';
    setTimeout(() => {
        notification.setAttribute('ariaHidden', true);
    }, 10*1000);

    notification.classList.remove('offline');
});
