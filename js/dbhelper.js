// TODO: fix ipmorting from node_modules
// import idb from 'idb';

const restaurantSymbol = Symbol('restaurantDB');

/**
 * Common database helper functions.
 */
class DBHelper {
    /**
     * IndexedDB promise.
     * Declared after the class definition as a static property.
     */
    static get restaurantDBPromise() {
        return DBHelper[restaurantSymbol];
    }

    /**
     * Store a restaurant or an array of restaurants in IndexedDB.
     */
    static storeRestaurants(restaurants) {
        return DBHelper._store('restarurantStore', restaurants)
            .catch(error => console.warn(
                'Error has occured while storing the restaurants in DB', error)
            )
    }

    /**
     * Get restaurant or array of restaurants in IndexedDB.
     */
    static retrieveRestaurants(callback, id) {
        return DBHelper.restaurantDBPromise.then(db => {
            const tx = db.transaction('restarurantStore');
            const store = tx.objectStore('restarurantStore');
            let promise;
            if (id !== undefined) {
                promise = store.get(Number(id))
            } else {
                promise = store.getAll();
            }

            return promise.then((data) => {
                if (!data || (Array.isArray(data) && data.length < 1)) {
                    tx.abort();
                    throw new Error('No record found.')
                }
                callback(null, data);
                return tx.complete;
            })
                .catch(error => {
                    callback(`Error has occured while retrieving data from DB: ${error}`, null)
                    tx.abort();
                    return Promise.reject();
                })
        });
    }

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get DATABASE_URL() {
        const port = 1337; // Change this to your server port
        return `http://localhost:${port}`;
    }

    /**
     * Fetch all restaurants.
     */
    static fetchRestaurants(callback) {
        DBHelper.retrieveRestaurants(callback)
            .catch(error => {
                fetch(`${DBHelper.DATABASE_URL}/restaurants`)
                    .then(response => response.json())
                    .then(restaurants => {
                        DBHelper.storeRestaurants(restaurants);
                        callback(null, restaurants);
                    })
                    .catch(error => {
                        callback(`Request failed. Returned status of ${error}`, null);
                    });
            });

    }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
        DBHelper.retrieveRestaurants(callback, id)
            .catch(error => {
                fetch(`${DBHelper.DATABASE_URL}/restaurants/${id}`)
                    .then(response => response.json())
                    .then(restaurant => {
                        if (restaurant) {
                            DBHelper.storeRestaurants(restaurant);
                            callback(null, restaurant);
                            return;
                        }
                        callback('Restaurant does not exist', null);
                    })
                    .catch(error => callback(error, null));
            })
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */
    static fetchRestaurantByCuisine(cuisine, callback) {
        // Fetch all restaurants  with proper error handling
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given cuisine type
                const results = restaurants.filter(
                    r => r.cuisine_type == cuisine
                );
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */
    static fetchRestaurantByNeighborhood(neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given neighborhood
                const results = restaurants.filter(
                    r => r.neighborhood == neighborhood
                );
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by all filters with proper error handling.
     */
    static fetchRestaurantByAllFilters(
        cuisine,
        neighborhood,
        favorite,
        callback
    ) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                let results = restaurants;
                if (cuisine !== 'all') {
                    // filter by cuisine
                    results = results.filter(r => r.cuisine_type === cuisine);
                }
                if (neighborhood !== 'all') {
                    // filter by neighborhood
                    results = results.filter(
                        r => r.neighborhood === neighborhood
                    );
                }
                if (favorite !== 'all') {
                    // filter by favorites
                    results = results.filter(r => {
                        const isFavoriteBool = JSON.parse(r.is_favorite);
                        if (favorite === 'favorites') return isFavoriteBool;
                        return !isFavoriteBool
                    });
                }
                callback(null, results);
            }
        });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */
    static fetchNeighborhoods(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all neighborhoods from all restaurants
                const neighborhoods = restaurants.map(
                    (v, i) => restaurants[i].neighborhood
                );
                // Remove duplicates from neighborhoods
                const uniqueNeighborhoods = neighborhoods.filter(
                    (v, i) => neighborhoods.indexOf(v) == i
                );
                callback(null, uniqueNeighborhoods);
            }
        });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    static fetchCuisines(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all cuisines from all restaurants
                const cuisines = restaurants.map(
                    (v, i) => restaurants[i].cuisine_type
                );
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter(
                    (v, i) => cuisines.indexOf(v) == i
                );
                callback(null, uniqueCuisines);
            }
        });
    }

    /**
     * Restaurant page URL.
     */
    static urlForRestaurant(restaurant) {
        return `./restaurant.html?id=${restaurant.id}`;
    }

    /**
     * Restaurant image URL.
     */
    static imageUrlForRestaurant(restaurant) {
        let image = `${restaurant.photograph}.jpg`;
        if (!restaurant.photograph) {
            image = 'placeholder.png';
        }
        return `/img/${image}`;
    }

    /**
     * Map marker for a restaurant.
     */
    static mapMarkerForRestaurant(restaurant, map) {
        const marker = new google.maps.Marker({
            position: restaurant.latlng,
            title: restaurant.name,
            url: DBHelper.urlForRestaurant(restaurant),
            map: map,
            animation: google.maps.Animation.DROP
        });
        return marker;
    }

    /**
     * Mark and unmark favorite restaurants
     */
    static modifyFavorites(restaurantId, isFavorite) {
        return fetch(`${DBHelper.DATABASE_URL}/restaurants/${restaurantId}?is_favorite=${isFavorite}`, {
            method: 'PUT'
        })
            .then(response => response.json())
            .then(restaurants => {
                return DBHelper.storeRestaurants(restaurants)
                    .then((e) => {
                        return restaurants;
                    });
            })
            .catch(error => {
                console.warn(`Request failed. Returned status of ${error}`, null);
            });
    }

    /**
     * Fetch reviews by restaurant id
     */

    static fetchReviewsByRestaurantId(id) {
        return DBHelper.retrieveReviews(id)
            .catch(error => {
                return fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`)
                    .then(response => response.json())
                    .then((reviews) => {
                        DBHelper.storeReviews(reviews);
                        return reviews;
                    })
                    .catch(error => {
                        console.warn(`Request failed. Returned status of ${error}`, null);
                        return Promise.reject(error);
                    });
            })
    }

    /**
     * Post review
     */
    static postReview({ restaurantId, rating, name, comments, createdAt }) {
        const data = {
            restaurant_id: restaurantId,
            rating,
            name,
            comments,
            createdAt
        }
        return fetch(`${DBHelper.DATABASE_URL}/reviews`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(review => {
                console.log(review)
                return review;
            })
            .catch(error => {
                console.warn(`Request failed. Returned status of ${error}`, null);
            });
    }

    /**
     * Store a review or an array of reviews in IndexedDB.
     */
    static storeReviews(reviews) {
        return DBHelper._store('reviewStore', reviews)
            .catch(error => console.warn(
                'Error has occured while storing the reviews in DB', error
            ));
    }

    /**
     * Get array of reviews from IndexedDB.
     */
    static retrieveReviews(id) {
        return DBHelper.restaurantDBPromise.then(db => {
            const tx = db.transaction('reviewStore');
            const store = tx.objectStore('reviewStore');
            const idIndex = store.index('restaurant_id');

            return idIndex.getAll(id);
        }).catch(error => {
            console.warn('Error has occured while retrieving data from DB:', error);
            return Promise.reject(error);
        });
    }

    /**
     * General function for storing data in IDB.
     */
    static _store(storeName, dataToStore) {
        return DBHelper.restaurantDBPromise.then(db => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            if (Array.isArray(dataToStore)) {
                return Promise.all(dataToStore.map(data => store.put(data)))
                    .then(e => tx.complete)
            }
            return store.put(dataToStore)
                .then(e => tx.complete)
        });
    }

    static storeReviewsForSync(review) {
        return DBHelper._store('reviewSyncStore', review)
            .catch(error => console.warn(
                'Error has occured while storing the reviews for sync in DB', error
            ));
    }

    static getReviewsForSync() {
        return DBHelper.restaurantDBPromise.then(db => {
            const tx = db.transaction('reviewSyncStore');
            const store = tx.objectStore('reviewSyncStore');

            return store.getAll();
        });
    }

    static deleteReviewAfterSync(id) {
        return DBHelper.getStore('reviewSyncStore', 'readwrite')
        .then(store => store.delete(id));
    }

    static getStore(storeName, mode) {
        return DBHelper.restaurantDBPromise.then(db => {
            let tx;
            if (mode) {
                tx = db.transaction(storeName, mode);
            } else {
                tx = db.transaction(storeName);
            }
            return tx.objectStore(storeName);
        })
    }
}

DBHelper[restaurantSymbol] = idb.open('restaurants', 1, upgradeDB => {
    upgradeDB.createObjectStore('restarurantStore', { keyPath: 'id' });
    upgradeDB.createObjectStore('reviewStore', { keyPath: 'id' });
    upgradeDB.createObjectStore('reviewSyncStore', { autoIncrement: true, keyPath: 'id' });
    return upgradeDB
});
