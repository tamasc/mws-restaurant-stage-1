(function () {
	let restaurant;
	let map;

	const reviewForm = document.querySelector('#review-form');
	const reviewField = document.querySelector('#new-review');
	const nameField = document.querySelector('#reviewer-name');
	const rateField = document.querySelector('#review-rating');

	reviewForm.addEventListener('submit', function (e) {
		e.preventDefault();

		const review = {
			restaurantId: self.restaurant.id,
			rating: rateField.value,
			name: nameField.value,
			comments: reviewField.value,
			createdAt: (new Date()).getTime()
		};

		if ('serviceWorker' in navigator) {
			DBHelper.storeReviewsForSync(review)
				.then(() => {
					return navigator.serviceWorker.ready.then((swRegistration) => {
						return swRegistration.sync.register('reviewSubmission');
					});
				})
				.catch(e => DBHelper.postReview(review).then(review => {
					fetchReviewsFromURL();
				}));
		} else {
			DBHelper.postReview(review).then(review => {
				fetchReviewsFromURL();
			});

		}

		reviewField.value = '';
		nameField.value = '';
		rateField.value = '';
	});

	/**
	 * Initialize Google map, called from HTML.
	 */
	window.initMap = () => {
		fetchRestaurantFromURL((error, restaurant) => {
			if (error) { // Got an error!
				console.warn(error);
			} else {
				self.map = new google.maps.Map(document.getElementById('map'), {
					zoom: 16,
					center: restaurant.latlng,
					scrollwheel: false
				});
				fillBreadcrumb();
				DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
				google.maps.event.addListenerOnce(self.map, 'idle', () => {
					document.getElementsByTagName('iframe')[0].title = "Google Maps";
				})
			}
		});
		fetchReviewsFromURL();
	}

	/**
	 * Get current restaurant from page URL.
	 */
	const fetchRestaurantFromURL = (callback) => {
		if (self.restaurant) { // restaurant already fetched!
			callback(null, self.restaurant)
			return;
		}
		const id = self.id || getParameterByName('id');
		if (!id) { // no id found in URL
			const error = 'No restaurant id in URL'
			callback(error, null);
		} else {
			DBHelper.fetchRestaurantById(id, (error, restaurant) => {
				self.restaurant = restaurant;
				if (!restaurant) {
					console.warn(error);
					return;
				}
				fillRestaurantHTML();
				callback(null, restaurant)
			});
		}
	}

	const fetchReviewsFromURL = () => {
		const id = parseInt(self.id || getParameterByName('id'), 10);
		if (!id) { // no id found in URL
			window.location.href = '/';
		} else {
			DBHelper.fetchReviewsByRestaurantId(id)
				.then(reviews => {
					// fill reviews
					fillReviewsHTML(reviews);
				});
		}
	}

	// we need it globally to use in index.js
	self.fetchReviewsFromURL = fetchReviewsFromURL;

	/**
	 * Create restaurant HTML and add it to the webpage
	 */
	const fillRestaurantHTML = (restaurant = self.restaurant) => {
		const name = document.getElementById('restaurant-name');
		name.innerHTML = restaurant.name;

		const favoriteIcon = RenderHelper.createFavoriteIcon(restaurant);
		const container = document.getElementById('name-container');
		container.append(favoriteIcon);

		const image = document.getElementById('restaurant-img');
		image.className = 'restaurant-img';
		image.alt = `image of restaurant ${restaurant.name}`;
		image.src = DBHelper.imageUrlForRestaurant(restaurant);

		const cuisine = document.getElementById('restaurant-cuisine');
		cuisine.innerHTML = restaurant.cuisine_type;

		const address = document.getElementById('restaurant-address');
		address.innerHTML = restaurant.address;

		// fill operating hours
		if (restaurant.operating_hours) {
			fillRestaurantHoursHTML();
		}
	}

	/**
	 * Create restaurant operating hours HTML table and add it to the webpage.
	 */
	const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
		const hours = document.getElementById('restaurant-hours');
		for (let key in operatingHours) {
			const row = document.createElement('tr');

			const day = document.createElement('td');
			day.innerHTML = key;
			row.appendChild(day);

			const time = document.createElement('td');
			time.innerHTML = operatingHours[key];
			row.appendChild(time);

			hours.appendChild(row);
		}
	}

	/**
	 * Create all reviews HTML and add them to the webpage.
	 */
	const fillReviewsHTML = (reviews) => {
		// const container = document.getElementById('reviews-container');
		const container = document.getElementById('reviews-list');
		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}
		if (!reviews && reviews.length < 1) {
			const noReviews = document.createElement('p');
			noReviews.innerHTML = 'No reviews yet!';
			container.appendChild(noReviews);
			return;
		}
		// const ul = document.getElementById('reviews-list');
		const sortedReviews = reviews.sort((a, b) => (new Date(b.createdAt)).getTime() - (new Date(a.createdAt)).getTime());
		sortedReviews.forEach(review => {
			container.appendChild(createReviewHTML(review));
		});
		// container.appendChild(ul);
	}

	/**
	 * Create review HTML and add it to the webpage.
	 */
	const createReviewHTML = (review) => {
		const li = document.createElement('li');
		const name = document.createElement('p');
		name.innerHTML = review.name;
		li.appendChild(name);

		const date = document.createElement('p');
		date.innerHTML = RenderHelper.formatDate(new Date(review.createdAt));
		li.appendChild(date);

		const rating = document.createElement('p');
		rating.innerHTML = `Rating: ${review.rating}`;
		li.appendChild(rating);

		const comments = document.createElement('p');
		comments.innerHTML = review.comments;
		li.appendChild(comments);

		return li;
	}

	/**
	 * Add restaurant name to the breadcrumb navigation menu
	 */
	const fillBreadcrumb = (restaurant = self.restaurant) => {
		const breadcrumb = document.getElementById('breadcrumb');
		const li = document.createElement('li');
		li.innerHTML = restaurant.name;
		breadcrumb.appendChild(li);
	}

	/**
	 * Get a parameter by name from page URL.
	 */
	const getParameterByName = (name, url) => {
		if (!url)
			url = window.location.href;
		name = name.replace(/[\[\]]/g, '\\$&');
		const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
			results = regex.exec(url);
		if (!results)
			return null;
		if (!results[2])
			return '';
		return decodeURIComponent(results[2].replace(/\+/g, ' '));
	}
})()
