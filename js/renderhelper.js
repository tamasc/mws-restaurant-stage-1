class RenderHelper {
    static createFavouriteIcon(restaurantData) {

        const favouriteIcon = document.createElement('span');
        favouriteIcon.setAttribute('role', 'img');
        favouriteIcon.classList.add('favourite-icon');
        if (restaurantData.s_favorite) {
          favouriteIcon.setAttribute('aria-label', 'Remove from favourites');
          favouriteIcon.innerHTML = '&#9733;';
        } else {
          favouriteIcon.setAttribute('aria-label', 'Add to favourites');
          favouriteIcon.innerHTML = '&#9734;';
        }

        return favouriteIcon;
    }
}