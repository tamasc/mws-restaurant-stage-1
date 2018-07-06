// TODO: fix ipmorting from node_modules
// import idb from 'idb';

const idbPromiseSymbol = Symbol('idbPromise');
/**
 * Common database helper functions.
 */
class DBHelper {
    /**
     * IndexedDB promise.
     * Declared after the class definition as a static property.
     */
    static get idbPromise() {
        return DBHelper[idbPromiseSymbol];
    }

    /**
     * Store restaurant or array of restaurants in IndexedDB.
     */
    static storeRestaurants(restaurants) {
        return DBHelper.idbPromise.then(db => {
            const tx = db.transaction('restarurantListStore', 'readwrite');
            const store = tx.objectStore('restarurantListStore');
            if (Array.isArray(restaurants)) {
                return Promise.all(restaurants.map(restaurant => store.put(restaurant)))
                    .then(e => tx.complete)
                    .catch(error => console.warn('Error has occured while storing the restaurants in DB', error))
            }
            return store.put(restaurants)
                .then(e => tx.complete)
                .catch(error => console.warn(
                    `Error has occured while storing the ${restaurant.name || ''} restaurant in DB`, error)
                )
        });
    }

    /**
     * Get restaurant or array of restaurants in IndexedDB.
     */
    static retrieveRestaurants(callback, id) {
        return DBHelper.idbPromise.then(db => {
            const tx = db.transaction('restarurantListStore', 'readwrite');
            const store = tx.objectStore('restarurantListStore');
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
        return `http://localhost:${port}/restaurants`;
    }

    /**
     * Fetch all restaurants.
     */
    static fetchRestaurants(callback) {
        DBHelper.retrieveRestaurants(callback)
            .catch(error => {
                fetch(`${DBHelper.DATABASE_URL}`)
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
                fetch(`${DBHelper.DATABASE_URL}/${id}`)
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
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    static fetchRestaurantByCuisineAndNeighborhood(
        cuisine,
        neighborhood,
        callback
    ) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                let results = restaurants;
                if (cuisine != 'all') {
                    // filter by cuisine
                    results = results.filter(r => r.cuisine_type == cuisine);
                }
                if (neighborhood != 'all') {
                    // filter by neighborhood
                    results = results.filter(
                        r => r.neighborhood == neighborhood
                    );
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
        return fetch(`${DBHelper.DATABASE_URL}/${restaurantId}?is_favorite=${isFavorite}`, {
            method: 'PUT',
        })
            .then(response => response.json())
            .then(restaurants => {
                DBHelper.storeRestaurants(restaurants)
                    .then((e) => {
                        console.log(e, restaurants)
                        return restaurants;
                    });
            })
            .catch(error => {
                console.warn(`Request failed. Returned status of ${error}`, null);
            });
    }
}

DBHelper[idbPromiseSymbol] = idb.open('restaurants', 1, upgradeDB => {
    const restaruantListStore = upgradeDB.createObjectStore('restarurantListStore', { keyPath: 'id' });
});
