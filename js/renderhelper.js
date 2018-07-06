class RenderHelper {
	static createFavoriteIcon(restaurant) {
		// NOTE: boolean strings remain strings after converting them to JSON when fetch
		const isFavorite = (restaurant.is_favorite === true || restaurant.is_favorite === 'true');

		const favoriteIcon = document.createElement('span');
		favoriteIcon.setAttribute('role', 'img');
		favoriteIcon.setAttribute('id', `icon-${restaurant.id}`);
		favoriteIcon.classList.add('favorite-icon');
		favoriteIcon.addEventListener(
			'click', () => {
				DBHelper.modifyFavorites(restaurant.id, !isFavorite)
					.then(modifiedRestaurant => {
						RenderHelper.updateFavoriteIcon(modifiedRestaurant);
					});
			}
		);
		if (isFavorite) {
			favoriteIcon.setAttribute('aria-label', 'Remove from favorites');
			favoriteIcon.innerHTML = '&#9733;';
		} else {
			favoriteIcon.setAttribute('aria-label', 'Add to favorites');
			favoriteIcon.innerHTML = '&#9734;';
		}

		return favoriteIcon;
	}

	static updateFavoriteIcon(restaurant) {
		const newIcon = RenderHelper.createFavoriteIcon(restaurant);
		const oldIcon = document.getElementById(`icon-${restaurant.id}`);
		if (oldIcon) {
			oldIcon.parentNode.replaceChild(newIcon, oldIcon);
		}
		console.log(oldIcon)
	}
}