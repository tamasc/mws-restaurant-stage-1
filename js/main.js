// lazy load images
const observer = lozad();
observer.observe()

// import DBHelper from './dbhelper';
let restaurants, neighborhoods, cuisines, map;
self.markers = [];


/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.warn(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    option.setAttribute('role', 'option');
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  google.maps.event.addListenerOnce(self.map, 'idle', () => {
    document.getElementsByTagName('iframe')[0].title = "Google Maps";
  })
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');
  const fSelect = document.getElementById('favorites-select');

  // reset aria-selected attr on options
  resetSelectOptions(cSelect);
  resetSelectOptions(nSelect);
  resetSelectOptions(fSelect);

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;
  const fIndex = fSelect.selectedIndex;

  // set aria-selected attr on active options
  cSelect[cIndex].setAttribute('aria-selected', true);
  nSelect[nIndex].setAttribute('aria-selected', true);
  fSelect[fIndex].setAttribute('aria-selected', true);

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;
  const favorite = fSelect[fIndex].value;

  DBHelper.fetchRestaurantByAllFilters(cuisine, neighborhood, favorite, (error, restaurants) => {
    if (error) { // Got an error!
      console.warn(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

const resetSelectOptions = (selectElement) => {
  if (selectElement) {
    Array.from(selectElement.getElementsByTagName('option'))
      .forEach((option) => {
        option.setAttribute('aria-selected', false);
      })
  }
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  observer.observe();
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  const imgSource = DBHelper.imageUrlForRestaurant(restaurant);
  const image = document.createElement('img');
  image.classList.add('restaurant-img', 'lozad');
  image.setAttribute('data-src', imgSource);
  image.alt = `image of restaurant ${restaurant.name}`;

  const nameContainer = document.createElement('div');
  nameContainer.classList.add('name-container');

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;

  const favoriteIcon = RenderHelper.createFavoriteIcon(restaurant);

  nameContainer.append(name, favoriteIcon);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);

  li.append(image, nameContainer, neighborhood, address, more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}
