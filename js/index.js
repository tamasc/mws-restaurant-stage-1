
// register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then((event) => console.log('Service worker successfully registered'))
        .catch((err) => console.warn('Service worker cannot be registered due to: ', err));

    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.type === 'reviewsPosted') {
            self.fetchReviewsFromURL();
        }
        if (event.data.type === 'favoritesModified') {
            RenderHelper.updateFavoriteIcon(event.data.restaurant);
        }
    });
}

if (!navigator.onLine) {
    offLineEventCb();
}

window.addEventListener('offline', offLineEventCb);
window.addEventListener('online', onLineEventCb);

function offLineEventCb() {
    const notification = document.getElementById('statusNotification');
    notification.innerText = 'The application is offline!';
    notification.setAttribute('ariaHidden', false);

    notification.classList.add('offline');
}

function onLineEventCb() {
    const notification = document.getElementById('statusNotification');
    notification.innerText = 'The application is online!';
    setTimeout(() => {
        notification.setAttribute('ariaHidden', true);
    }, 10*1000);

    notification.classList.remove('offline');
}