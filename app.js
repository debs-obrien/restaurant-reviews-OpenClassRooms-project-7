"use strict";
let map;
let infoWindow;
let infoWindowSmall;
let infoWindowNew;
let markers = [];
let autocomplete;
let autocompleteRestaurant;
let hostnameRegexp = new RegExp('^https?://.+?/');
let sortAsc = false;
let sortDesc = false;
let allStars = false;
let sort5Star = false;
let sort3Star = false;
let sort4Star = false;
let newReviewArray = [];
let newRestaurantMarker = [];
let restaurantIsNew = true;
let newPlace = [];
let newResNum = -1;
let myRestaurants = [];
let googleRestaurants = [];
let restaurantInfoDiv = document.getElementById('restaurant-info');
let searchDiv = document.getElementById('search');
let sortOptionsDiv = document.getElementById('sort-options');
sortOptionsDiv.style.display = "none";
restaurantInfoDiv.style.display = "none";
searchDiv.style.display = "none";
let sortBy = document.getElementById('sort');
let form = document.getElementById('form-add-restaurant');
let hasPhoto = true;
let pos = {
    lat: 39.5696,
    lng: 2.6502,
};

function restSort() {
    sortAsc = false;
    sortDesc = false;
    sort4Star = false;
    sort3Star = false;
    sort5Star = false;
    allStars = false;
}
/*-----------------------------------------------------------------------------------
creates the stars for the rating
-------------------------------------------------------------------------------------*/
function starRating(place) {
    let rating = [];
    if (place.rating) {
        for (let i = 0; i < 5; i++) {
            if (place.rating < (i + 0.5)) {
                rating.push('&#10025;');
            } else {
                rating.push('&#10029;');
            }
        }
        return rating.join(' ');
    }
}

/*-----------------------------------------------------------------------------------
initializes the map
-------------------------------------------------------------------------------------*/
function initMap() {

    /*-----------------------------------------------------------------------------------
     uses geo location to find out where you are
    -------------------------------------------------------------------------------------*/
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {

            pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };


            if (typeof google === 'object' && typeof google.maps === 'object') {
                searchDiv.style.display = "block";
                sortOptionsDiv.style.display = "block";
            }

            map = new google.maps.Map(document.getElementById('map'), {
                center: pos,
                zoom: 14,
                streetViewControl: false
            });

            infoWindow = new google.maps.InfoWindow({
                content: document.getElementById('info-content')
            });
            infoWindowSmall = new google.maps.InfoWindow({
                content: document.getElementById('info-content-small'),
            });
            infoWindowNew = new google.maps.InfoWindow({
                content: document.getElementById('info-content-new-restaurant'),
            });

            infoWindow.setPosition(pos);
            map.setCenter(pos);
            //adds the circle of where you are
            let marker = new google.maps.Marker({
                position: pos,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: 'blue',
                    fillOpacity: 0.3,
                    scale: 20,
                    strokeColor: 'blue',
                    strokeWeight: 1,
                    zIndex: 1
                },
                draggable: true
            });
            //adds animation to the circle of where you are
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function () {
                marker.setAnimation(null)
            }, 4000);
            //adds the marker of where you are
            marker.setMap(map);
            /*-----------------------------------------------------------------------------------
            input fields on autocomplete search for city or establishment and call
            the on placeChangedFunction which searchs again to give new results
            -------------------------------------------------------------------------------------*/
            autocomplete = new google.maps.places.Autocomplete(
                /** @type {!HTMLInputElement} */
                (document.getElementById('autocomplete-input')), {
                    types: ['(cities)'],
                });
            autocompleteRestaurant = new google.maps.places.Autocomplete(
                /** @type {!HTMLInputElement} */
                (document.getElementById('autocompleteRestaurant-input')), {
                    types: ['establishment']
                });

            autocomplete.addListener('place_changed', onPlaceChanged);
            autocompleteRestaurant.addListener('place_changed', onPlaceChanged2);
            google.maps.event.trigger(map, 'resize');
            /*-----------------------------------------------------------------------------------
             if the map is dragged search again
            -------------------------------------------------------------------------------------*/
            map.addListener('dragend', function () {
                sortBy.value = 'allStars';
                myRestaurants=[];
                restSort();
                search();
            });
            /*-----------------------------------------------------------------------------------
            right clicking could be used to add new restaurant
            -------------------------------------------------------------------------------------*/
            map.addListener('rightclick', function (e) {
                closeInfoWindow();
                restaurantIsNew = true;
                let latlng = new google.maps.LatLng(e.latLng.lat(), e.latLng.lng());
                let marker = new google.maps.Marker({
                    position: latlng,
                    icon: createMarkerStars(latlng),
                    id: newResNum + 1
                });
                google.maps.event.addListener(marker, 'click', addRestaurantInfoWindow);
                marker.setMap(map);
            });

            /*-----------------------------------------------------------------------------------
            When the user selects a city, get the place details for the city and
            zoom the map in on the city.
            -------------------------------------------------------------------------------------*/
            function onPlaceChanged() {
                myRestaurants=[];
                sortBy.value = 'allStars';
                let place = autocomplete.getPlace();
                if (place.geometry) {
                    map.panTo(place.geometry.location);
                    map.setZoom(15);
                    search();
                } else {
                    document.getElementById('autocomplete').placeholder = 'Search for a City';
                }
            }

            /*-----------------------------------------------------------------------------------
            When the user selects a restaurant, get the place details for the restaurant and
            -------------------------------------------------------------------------------------*/
            function onPlaceChanged2() {
                myRestaurants=[];
                sortBy.value = 'allStars';
                let place = autocompleteRestaurant.getPlace();
                if (place.geometry) {
                    map.panTo(place.geometry.location);
                    map.setZoom(15);
                    search();
                } else {
                    document.getElementById('autocompleteRestaurant').placeholder = 'Search for a Restaurant';
                }
            }

            /*-----------------------------------------------------------------------------------
            uses the places api to search for places of type restaurant
            -------------------------------------------------------------------------------------*/
            const places = new google.maps.places.PlacesService(map);
            const service = new google.maps.places.PlacesService(map);
            service.nearbySearch({
                location: pos,
                radius: 500,
                type: ['restaurant']
            }, callback);

            function callback(results, status) {
                const script = document.createElement('script');
                script.src = 'restaurants.js';
                document.getElementsByTagName('head')[0].appendChild(script);
                window.eqfeed_callback = function (results) {
                    results = results.results;
                    myRestaurants = [];
                    for (let i = 0; i < results.length; i++) {
                        myRestaurants.push(results[i]);
                    }

                };
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    search()
                }
            }

            function search() {
                let search = {
                    bounds: map.getBounds(),
                    type: ['restaurant']
                };
                places.nearbySearch(search, function (results, status, pagination) {

                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        clearResults();
                        clearMarkers();

                        googleRestaurants = [];
                        for (let i = 0; i < results.length; i++) {
                            googleRestaurants.push(results[i]);
                        }
                        for (let i = 0; i < results.length; i++) {
                            markers[i] = new google.maps.Marker({
                                position: results[i].geometry.location,
                                placeId: results[i].id,
                                //animation: google.maps.Animation.DROP,
                                icon: createMarkerStars(googleRestaurants[i]),
                                zIndex: 52,
                            });
                            // If the user clicks a restaurant marker, show the details of that restaurant
                            google.maps.event.addListener(markers[i], 'mouseover', showInfoWindowSmall);
                            google.maps.event.addListener(markers[i], 'mouseout', closeInfoWindowSmall);
                            google.maps.event.addListener(markers[i], 'click', showInfoWindow);
                            google.maps.event.addListener(map, "click", closeInfoWindow);
                            google.maps.event.addListener(markers[i], "touchstart", closeInfoWindowSmall);
                            google.maps.event.addListener(markers[i], "touchend", closeInfoWindowSmall);


                            if (sort3Star) {
                                if (Math.round(results[i].rating) <= 3) {
                                    addResultsAndMarkers(i, results, i);
                                }
                            } else if (sort4Star) {
                                if (Math.round(results[i].rating) === 4) {
                                    addResultsAndMarkers(i, results, i);
                                }
                            } else if (sort5Star) {
                                if (Math.round(results[i].rating) === 5) {
                                    addResultsAndMarkers(i, results, i);
                                }
                            } else {
                                if (sortAsc) {
                                    results.sort(function (a, b) {
                                        return b.rating - a.rating;
                                    });
                                } else if (sortDesc) {
                                    results.sort(function (a, b) {
                                        return a.rating - b.rating;
                                    });
                                }
                                addResultsAndMarkers(i, results, i);
                            }
                        }
                        for (let i = 0; i < myRestaurants.length; i++) {
                            markers[googleRestaurants.length +i] = new google.maps.Marker({
                                position: myRestaurants[i].geometry.location,
                                placeId: myRestaurants[i].id,
                                icon: createMarkerStars(myRestaurants[i]),
                                zIndex: 52,
                                id: myRestaurants[i].id,
                            });
                            // If the user clicks a restaurant marker, show the details of that restaurant
                            google.maps.event.addListener(markers[googleRestaurants.length +i], 'mouseover', showInfoWindowSmallMy);
                            google.maps.event.addListener(markers[googleRestaurants.length +i], 'mouseout', closeInfoWindowSmall);
                            google.maps.event.addListener(markers[googleRestaurants.length +i], 'click', showInfoWindowMy);
                            google.maps.event.addListener(map, "click", closeInfoWindow);
                            google.maps.event.addListener(markers[googleRestaurants.length +i], "touchstart", closeInfoWindowSmall);
                            google.maps.event.addListener(markers[googleRestaurants.length +i], "touchend", closeInfoWindowSmall);
                            if (sort3Star) {
                                if (Math.round(myRestaurants[i].rating) <= 3) {
                                    addResultsAndMarkers(googleRestaurants.length+i, myRestaurants, i);
                                }
                            } else if (sort4Star) {
                                if (Math.round(myRestaurants[i].rating) === 4) {
                                    addResultsAndMarkers(googleRestaurants.length+i, myRestaurants, i);
                                }
                            } else if (sort5Star) {
                                if (Math.round(myRestaurants[i].rating) === 5) {
                                    addResultsAndMarkers(googleRestaurants.length+i, myRestaurants, i);
                                }
                            } else {
                                if (sortAsc) {
                                    myRestaurants.sort(function (a, b) {
                                        return b.rating - a.rating;
                                    });
                                } else if (sortDesc) {
                                    myRestaurants.sort(function (a, b) {
                                        return a.rating - b.rating;
                                    });
                                }
                                addResultsAndMarkers(googleRestaurants.length+i, myRestaurants, i);
                            }

                        }

                        /*let moreButton = document.getElementById('more');
                        if (pagination.hasNextPage) {

                            moreButton.style.display = 'block';
                            moreButton.disabled = false;
                            moreButton.addEventListener('click', function () {
                                moreButton.disabled = true;
                                clearResults();
                                myRestaurants = [];
                                pagination.nextPage();
                            });
                        } else {
                            moreButton.style.display = '';
                        }*/
                    }
                });
            }

            /*-----------------------------------------------------------------------------------
            event listener for sort by by
            -------------------------------------------------------------------------------------*/
            sortBy.addEventListener('change', function () {
                if (sortBy.value === 'sortAsc') {
                    restSort();
                    sortAsc = true;
                    search();

                } else if (sortBy.value === 'sortDesc') {
                    restSort();
                    sortDesc = true;
                    search();
                }
                else if (sortBy.value === 'sort4Star') {
                    restSort();
                    sort4Star = true;
                    search();
                }
                else if (sortBy.value === 'sort3Star') {
                    restSort();
                    sort3Star = true;
                    search();
                }
                else if (sortBy.value === 'sort5Star') {
                    restSort();
                    sort5Star = true;
                    search();
                }
                else if (sortBy.value === 'allStars') {
                    restSort();
                    allStars = true;
                    search();
                }
            });

            /*-----------------------------------------------------------------------------------
            resets the values
            -------------------------------------------------------------------------------------*/
            function clearMarkers() {
                for (let i = 0; i < markers.length; i++) {
                    if (markers[i]) {
                        markers[i].setMap(null);
                    }
                }
                markers = [];
            }

            function clearResults() {
                let results = document.getElementById('results');
                while (results.childNodes[0]) {
                    results.removeChild(results.childNodes[0]);
                }
            }

            /*-----------------------------------------------------------------------------------
            drops the markers onto the map
            -------------------------------------------------------------------------------------*/
            function dropMarker(i) {
                return function () {
                    markers[i].setMap(map);
                };
            }

            /*-----------------------------------------------------------------------------------
            creates the list of restaurants on the right of the map
            -------------------------------------------------------------------------------------*/
            function addResultList(result, i) {
                let resultsDiv = document.getElementById('results');
                let listDiv = document.createElement('div');
                listDiv.setAttribute('class', 'results-list');
                listDiv.onclick = function () {
                    google.maps.event.trigger(markers[i], 'click');
                };
                let details = `<div class="placeIcon"><img src ="${createPhoto(result)}" /></div>
                                <div class="placeDetails">
                                <div class="name">${result.name}</div>`;
                if(result.rating){
                    details += `<div class="rating">${starRating(result)}</div>`;
                }
                details += `<a href="#restaurant-info" class="reviews-link">See Reviews</a>
                             </div>`;
                listDiv.insertAdjacentHTML("beforeEnd", details);
                resultsDiv.appendChild(listDiv);
            }

            /*-----------------------------------------------------------------------------------
            creates the photo from the api
            -------------------------------------------------------------------------------------*/
            function createPhoto(place) {
                let photos = place.photos;
                let photo;
                if (!photos) {
                    photo = place.icon;
                    hasPhoto = false;
                } else {
                    hasPhoto = true;
                    photo = photos[0].getUrl({
                        'maxWidth': 600,
                        'maxHeight': 400
                    });
                }

                return photo;
            }

            /*-----------------------------------------------------------------------------------
            Shows the info window with details of the restaurant
            -------------------------------------------------------------------------------------*/
            function showInfoWindow() {
                closeInfoWindowSmall();
                let marker = this;
                places.getDetails({
                    placeId: marker.placeResult.place_id
                }, function(place, status) {
                    if (status !== google.maps.places.PlacesServiceStatus.OK) {
                        return;
                    }
                    infoWindow.open(map, marker);
                    buildIWContent(place);
                    displayRestaurantInfo(place);
                });
            }

            function showInfoWindowSmall() {
                closeInfoWindow();
                let marker = this;
                places.getDetails({
                    placeId: marker.placeResult.place_id
                }, function(place, status) {
                    if (status !== google.maps.places.PlacesServiceStatus.OK) {
                        return;
                    }
                    infoWindowSmall.open(map, marker);
                    buildIWContentSmall(place);
                });
            }
            function showInfoWindowMy() {
                closeInfoWindowSmall();
                let marker = this;
                infoWindow.open(map, marker);
                buildIWContent(myRestaurants[marker.id]);
                displayRestaurantInfo(myRestaurants[marker.id]);
            }
            function showInfoWindowSmallMy() {
                closeInfoWindowSmall();
                let marker = this;
                infoWindowSmall.open(map, marker);
                buildIWContentSmall(myRestaurants[marker.id]);
            }
            function addRestaurantInfoWindow() {
                let marker = this;
                if (restaurantIsNew) {
                    infoWindowNew.open(map, marker);
                    buildResDetailContent(marker);
                    newRestaurantMarker.push(marker);
                    newResNum += 1;
                } else {
                    infoWindow.open(map, marker);
                    buildIWContent(newPlace[marker.id]);
                    displayRestaurantInfo(newPlace[marker.id]);
                }
            }

            /*-----------------------------------------------------------------------------------
            close the Info Windows
            -------------------------------------------------------------------------------------*/
            function closeInfoWindow() {
                infoWindow.close(map, marker);
            }
            function closeInfoWindowSmall() {
                infoWindowSmall.close(map, marker);
            }
            function closeInfoWindowNew() {
                infoWindowNew.close(map, marker);
            }
            /*-----------------------------------------------------------------------------------
            displays extra info below when restaurant is clicked
            -------------------------------------------------------------------------------------*/
            function displayRestaurantInfo(place) {
                showTheForm();
                restaurantInfoDiv.style.display = "block";
                document.getElementById('name').textContent = place.name;
                document.getElementById('address').textContent = place.vicinity;
                document.getElementById('telephone').textContent = place.formatted_phone_number;
                if (place.website) {
                    let website = hostnameRegexp.exec(place.website);
                    if (website === null) {
                        website = 'http://' + place.website + '/';
                    }
                    document.getElementById('website').innerHTML = '<a href="' + website + '">Visit Restaurant Website</a>';
                }
                let reviewsDiv = document.getElementById('reviews');
                let reviewHTML = '';
                reviewsDiv.innerHTML = reviewHTML;
                if (place.reviews) {
                    if (place.reviews.length > 0) {
                        for (let i = 0; i < place.reviews.length; i += 1) {
                            let review = place.reviews[i];
                            let avatar;
                            if (place.reviews[i].profile_photo_url) {
                                avatar = place.reviews[i].profile_photo_url;
                            } else {
                                avatar = 'img/avatar.png';
                            }
                            reviewHTML += `<div class="restaurant-reviews">
                                          <h3 class="review-title">
                                             <span class="profile-photo" style="background-image: url('${avatar}')"></span>`;
                            if(place.rating){
                                reviewHTML +=  `<span id="review-rating" class="rating">${starRating(review)}</span>`;
                            }
                            reviewHTML +=  ` </h3>
                                                <p> ${place.reviews[i].text} </p>
                                            </div>`;
                            reviewsDiv.innerHTML = reviewHTML;
                        }
                    }
                }

                /*-----------------------------------------------------------------------------------
                adds the street view functionality
                -------------------------------------------------------------------------------------*/

                let sv = new google.maps.StreetViewService();
                sv.getPanorama({
                    location: place.geometry.location,
                    radius: 50
                }, processSVData);

                const panoDiv = document.getElementById('pano');
                const streetViewWrapper = document.getElementById('street-view-wrapper');
                const photoDiv = document.getElementById('photo');
                const seePhoto = document.getElementById('see-photo');
                const seeStreetView = document.getElementById('see-street-view');
                photoDiv.innerHTML = '<img class="photo-big" ' + 'src="' + createPhoto(place) + '"/>';

                streetViewWrapper.style.display = 'block';
                seeStreetView.style.display = 'none';
                photoDiv.style.display = 'none';
                if(hasPhoto){
                    seePhoto.style.display = 'block';
                }else{
                    seePhoto.style.display = 'none';
                }

                function processSVData(data, status) {
                    if (status === 'OK') {
                        let panorama = new google.maps.StreetViewPanorama(panoDiv);
                        panorama.setPano(data.location.pano);
                        panorama.setPov({
                            heading: 270,
                            pitch: 0
                        });
                        panorama.setVisible(true);
                        /*-----------------------------------------------------------------------------------
                        click street view button and show street view hide photo
                        -------------------------------------------------------------------------------------*/
                        seeStreetView.addEventListener("click", function(){
                            seeStreetView.style.display = 'none';
                            seePhoto.style.display = 'block';
                            streetViewWrapper.style.display = 'block';
                            photoDiv.style.display = 'none';
                        });
                        /*-----------------------------------------------------------------------------------
                        click photo  button and show photo hide street view
                        -------------------------------------------------------------------------------------*/
                        seePhoto.addEventListener("click", function(){
                            seeStreetView.style.display = 'block';
                            seePhoto.style.display = 'none';
                            streetViewWrapper.style.display = 'none';
                            photoDiv.style.display = 'block';
                        });

                    } else {
                        seePhoto.style.display = 'none';
                        streetViewWrapper.style.display = 'none';
                        photoDiv.style.display = 'block';
                    }
                }
            }
            /*-----------------------------------------------------------------------------------
            creates the markers with stars and adds default if no rating
            -------------------------------------------------------------------------------------*/
            function createMarkerStars(result) {
                let rating = Math.round(result.rating);
                let markerIcon;
                if (isNaN(rating)) {
                    markerIcon = 'img/' + 'marker_default.png';
                } else {
                    markerIcon = 'img/' + 'marker_' + rating + '.png';
                }
                return markerIcon;
            }

            /*-----------------------------------------------------------------------------------
            adds the results and the markers
            -------------------------------------------------------------------------------------*/
            function addResultsAndMarkers(markersI, array, i){
                addResultList(array[i], markersI);
                markers[markersI].placeResult = array[i];
                setTimeout(dropMarker(markersI), i * 100);
            }

            /*-----------------------------------------------------------------------------------
            Builds the small info Window
            -------------------------------------------------------------------------------------*/
            function buildIWContentSmall(place) {
                document.getElementById('iw-icon-small').innerHTML = '<img class="photo" ' + 'src="' + createPhoto(place) + '"/>';
                document.getElementById('iw-url-small').innerHTML = '<b>' + place.name + '</b>';
                if (place.rating) {
                    let ratingHtml = '';
                    for (let i = 0; i < 5; i++) {
                        if (place.rating < (i + 0.5)) {
                            ratingHtml += '&#10025;';
                        } else {
                            ratingHtml += '&#10029;';
                        }
                        document.getElementById('iw-rating-small').style.display = '';
                        document.getElementById('iw-rating-small').innerHTML = ratingHtml;
                    }
                } else {
                    document.getElementById('iw-rating-small').style.display = 'none';
                }
            }

            /*-----------------------------------------------------------------------------------
            Builds the big info Window
            -------------------------------------------------------------------------------------*/
            function buildIWContent(place) {
                document.getElementById('iw-icon').innerHTML = '<img class="photo" ' + 'src="' + createPhoto(place) + '"/>';
                document.getElementById('iw-url').innerHTML = '<b><a href="#restaurant-info">' + place.name + '</a></b>';
                document.getElementById('iw-address').textContent = place.vicinity;
                if (place.formatted_phone_number) {
                    document.getElementById('iw-phone').style.display = '';
                    document.getElementById('iw-phone').textContent = place.formatted_phone_number;
                } else {
                    document.getElementById('iw-phone').style.display = 'none';
                }
                if (place.rating) {
                    let ratingHtml = '';
                    for (let i = 0; i < 5; i++) {
                        if (place.rating < (i + 0.5)) {
                            ratingHtml += '&#10025;';
                        } else {
                            ratingHtml += '&#10029;';
                        }
                        document.getElementById('iw-rating').style.display = '';
                        document.getElementById('iw-rating').innerHTML = ratingHtml;
                    }
                } else {
                    document.getElementById('iw-rating').style.display = 'none';
                }
                if (place.website) {
                    let website = hostnameRegexp.exec(place.website);
                    if (website === null) {
                        website = 'http://' + place.website + '/';
                    }
                    document.getElementById('iw-website').style.display = '';
                    document.getElementById('iw-website').innerHTML = '<a href="' + website + '">' + place.website + '</a>';

                } else {
                    document.getElementById('iw-website').style.display = 'none';
                }
                if (place.opening_hours) {
                    if (place.opening_hours.open_now) {
                        document.getElementById('iw-open').style.display = '';
                        document.getElementById('iw-open').textContent = 'Open Now';
                    } else {
                        document.getElementById('iw-open').style.display = 'none';
                    }
                }
                document.getElementById('iw-reviews').textContent = 'See Reviews'
            }

            /*-----------------------------------------------------------------------------------
            Builds the new Restaurant info Window
            -------------------------------------------------------------------------------------*/
            function buildResDetailContent(marker) {
                restaurantInfoDiv.style.display = "block";
                form.style.padding = '10px';
                form.innerHTML = `
                    <h3 class="add-res-heading">Add A Restaurant</h3>
                    <input type="text" id="res-name" name="res-name" placeholder="Restaurant Name" required/>
                    <input type="hidden" id="res-location-lat" name="res-location-lat" value="${marker.position.lat()}"/>
                    <input type="hidden" id="res-location-lng" name="res-location-lng" value="${marker.position.lng()}"/>
                    <input type="text" name="res-address" id="res-address" placeholder="Restaurant Address" required/>
                    <label for="res-rating">Rating: </label>
                    <select name="res-rating" id="res-rating" required>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                        </select>
                    <input type="text" name="res-telephone" id="res-telephone" placeholder="Restaurant Telephone" />
                    <input type="text" name="res-website" id="res-website" placeholder="Restaurant Website" />
                    <button id="add-restaurant" class="button add-restaurant">Add New Restaurant</button>`;
            }

            document.getElementById("form-add-restaurant").addEventListener("submit", function (e) {
                e.preventDefault();
                form.style.padding = '';
                let name = document.getElementById('res-name');
                let address = document.getElementById('res-address');
                let telephone = document.getElementById('res-telephone');
                let website = document.getElementById('res-website');
                let rating = document.getElementById('res-rating');
                let locationLat = document.getElementById('res-location-lat');
                let locationLng = document.getElementById('res-location-lng');

                let position = new google.maps.LatLng(locationLat.value, locationLng.value);

                let place = {
                    name: name.value,
                    vicinity: address.value,
                    website: website.value,
                    url: website.value,
                    formatted_phone_number: telephone.value,
                    rating: rating.value,
                    position: position,
                    geometry: {location: position},
                    icon: 'https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png',
                    reviews: '',
                    photos: '',

                };
                /*-----------------------------------------------------------------------------------
                Pushes to array so that it knows which new restaurant to open when you add more than one
                -------------------------------------------------------------------------------------*/
                newPlace.push(place);
                closeInfoWindowNew();
                let marker = newRestaurantMarker[newResNum];
                restaurantIsNew = false;
                infoWindow.open(map, marker);
                buildIWContent(place);
                displayRestaurantInfo(place);

            });

            /*-----------------------------------------------------------------------------------*/

        }, function (error) {
            let loadingDiv= document.getElementById('loading');
            if(error.code === 0){
                loadingDiv.innerHTML = "An unknown error occurred.";
            } else if(error.code === 1) {
                loadingDiv.innerHTML = "User denied the request for Geolocation. Refresh the broswer and allow Geolocation";
            } else if(error.code === 2) {
                loadingDiv.innerHTML = "Location information is unavailable.";
            } else if(error.code === 3) {
                loadingDiv.innerHTML = "The request to get user location timed out.";
            }
            handleLocationError(true, infoWindow, map.getCenter(pos));
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter(pos));
    }
    function handleLocationError(browserHasGeolocation, infoWindow, pos) {
        infoWindow.setPosition(pos);
        infoWindow.setContent(browserHasGeolocation ?
            'Error: The Geolocation service failed.' :
            'Error: Your browser doesn\'t support geolocation.');
        infoWindow.open(map);

    }


}

/*-----------------------------------------------------------------------------------
Shows or hides the form for the restaurant reviews
-------------------------------------------------------------------------------------*/
function showTheForm() {
    document.getElementById("form-wrapper").style.display = 'block';
    document.getElementById("add-review-button").style.display = 'block';
}

function hideTheForm() {
    document.getElementById("form-wrapper").style.display = 'none';
    document.getElementById("add-review-button").style.display = 'none';
}

/*-----------------------------------------------------------------------------------
Form functionality on submit add new review to top of reviews and save to array
-------------------------------------------------------------------------------------*/
document.getElementById("add-review").addEventListener("submit", function (e) {
    e.preventDefault();
    let newName = document.getElementById("your-name");
    let newRating = document.getElementById("your-rating");
    let newReview = document.getElementById("your-review");
    if (!(newName.value && newRating.value && newReview.value)) { //if not empty return
        return;
    }
    addReview(newName.value, newRating.value, newReview.value); //add to array values from form
    newName.value = ""; //reset form values to 0
    newRating.value = "";
    newReview.value = "";
    hideTheForm(); //hide form and add button
});

function addReview(newName, newRating, newReview) { //add to array and to the page
    let newReviewDetails = {
        name: newName,
        rating: newRating,
        review: newReview,
    };
    let avatar = 'img/avatar.png';
    let reviewsDiv = document.getElementById('reviews');
    let newReviewHTML = '';
    newReviewHTML += `<div class="restaurant-reviews">
                         <h3 class="review-title">
                         <span class="profile-photo" style="background-image: url('${avatar}')"></span>
                         <span id="review-rating" class="rating">${starRating(newReviewDetails)}</span>
                         </h3>
                         <p> ${newReviewDetails.review} </p>
                       </div>`;
    newReviewArray.push(newReviewDetails); //push new values to array to store them
    reviewsDiv.insertAdjacentHTML("afterbegin", newReviewHTML); //add to the top of content
}