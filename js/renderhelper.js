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
				const updatedRestaurant = Object.assign({}, restaurant, { is_favorite: !isFavorite })
				if ('serviceWorker' in navigator) {
					const updateFn = () => DBHelper.modifyFavorites(updatedRestaurant)
						.then(RenderHelper.updateFavoriteIcon(updatedRestaurant));
					DBHelper.storeFavoritesForSync(updatedRestaurant)
						.then(() => navigator.serviceWorker.ready.then((swRegistration) => {
							return swRegistration.sync.register('modifyFavorites');
						}))
						.catch(updateFn);
				} else {
					DBHelper.modifyFavorites(updatedRestaurant)
						.then(updateFn);
				}
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
	}

	static formatDate(dateObject) {
		if (isNaN(dateObject)) return '';
        const addTrailingZero = (number) => ('0' + number).slice(-2);

        const year = dateObject.getFullYear();
        const month = addTrailingZero(dateObject.getMonth() + 1);
        const day = addTrailingZero(dateObject.getDate());
        const hours = dateObject.getHours();
        const minutes = addTrailingZero(dateObject.getMinutes());

        return `${year}.${month}.${day} ${hours}:${minutes}`;
    }
}