"use strict";
var map;
var infoWindow;
let infoWindowSmall;
let infoWindowNew;
var markers = [];
var autocomplete;
var autocompleteRestaurant;
var hostnameRegexp = new RegExp('^https?://.+?/');
var restaurantInfoDiv = document.getElementById('restaurant-info');
restaurantInfoDiv.style.display = "none";
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
let allRestaurants = [];
let sortBy = document.getElementById('sort');


function restSort(){
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
        navigator.geolocation.getCurrentPosition(function(position) {

            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude

            };

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
            var marker = new google.maps.Marker({
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
            setTimeout(function() {
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
            map.addListener('dragend', function() {
                sortBy.value = 'allStars';
                restSort();
                search();
            });
            /*-----------------------------------------------------------------------------------
            right clicking could be used to add new restaurant
            -------------------------------------------------------------------------------------*/
            google.maps.event.addListener(map, "rightclick", function(event) {
                var lat = event.latLng.lat();
                var lng = event.latLng.lng();
                // populate yor box/field with lat, lng
                alert("Lat=" + lat + "; Lng=" + lng);
            });
            map.addListener('dblclick', function(e) {
                restaurantIsNew = true;
                var latlng = new google.maps.LatLng(e.latLng.lat(), e.latLng.lng());
                var marker = new google.maps.Marker({
                    position: latlng,
                    icon: createMarkerStars(latlng),
                    id: newResNum +1
                });

                    google.maps.event.addListener(marker, 'click', addRestaurantInfoWindow);
                    marker.setMap(map);

            });
            /*-----------------------------------------------------------------------------------
            When the user selects a city, get the place details for the city and
            zoom the map in on the city.
            -------------------------------------------------------------------------------------*/
            function onPlaceChanged() {
                sortBy.value = 'allStars';
                var place = autocomplete.getPlace();
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
            var places = new google.maps.places.PlacesService(map);
            var service = new google.maps.places.PlacesService(map);


            service.nearbySearch({
                location: pos,
                radius: 500,
                type: ['restaurant']
            }, callback);

            function callback(results, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    search()
                }
            }
            function search() {
                let search = {
                    bounds: map.getBounds(),
                    type: ['restaurant']
                };
                places.nearbySearch(search, function(results, status, pagination) {

                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        clearResults();
                        clearMarkers();
                        var script = document.createElement('script');
                        script.src = 'restaurants.js';
                        document.getElementsByTagName('head')[0].appendChild(script);
                        window.eqfeed_callback = function(results) {
                            console.log(results.results[0]);
                            results = results.results;

                            for (var i = 0; i < results.length; i++) {
                                allRestaurants.push(results[i]);
                                markers[i] = new google.maps.Marker({
                                    position: results[i].geometry.location,
                                    //animation: google.maps.Animation.DROP,
                                    icon: createMarkerStars(results[i]),
                                    zIndex: 52,
                                    id:i,
                                });

                                // If the user clicks a restaurant marker, show the details of that restaurant
                                google.maps.event.addListener(markers[i], 'click', showInfoWindowJSON);
                                google.maps.event.addListener(markers[i], 'mouseover', showInfoWindowSmallJSON);
                                google.maps.event.addListener(markers[i], 'mouseout', closeInfoWindowSmall);
                                google.maps.event.addListener(map, "click", closeInfoWindow);

                            }

                        };

                        for (let i = 0; i < results.length; i++) {
                            markers[i] = new google.maps.Marker({
                                position: results[i].geometry.location,
                                //animation: google.maps.Animation.DROP,
                                icon: createMarkerStars(results[i]),
                                zIndex: 52
                            });

                            // If the user clicks a restaurant marker, show the details of that restaurant
                            google.maps.event.addListener(markers[i], 'click', showInfoWindow);
                            google.maps.event.addListener(markers[i], 'mouseover', showInfoWindowSmall);
                            google.maps.event.addListener(markers[i], 'mouseout', closeInfoWindowSmall);
                            google.maps.event.addListener(map, "click", closeInfoWindow);

                            setTimeout(dropMarker(i), i * 100);

                            if (sort3Star) {
                                if (Math.round(results[i].rating) <=3) {
                                    addResultList(results[i], i);
                                }
                            }else if (sort4Star) {
                                if (Math.round(results[i].rating) === 4) {
                                    addResultList(results[i], i);
                                }

                            }else if (sort5Star) {
                                if (Math.round(results[i].rating) === 5) {
                                    addResultList(results[i], i);
                                    if(results[i] === 0){
                                        resultsDiv.innerHTML = 'Sorry no 5 star Hotels. Filter again!!'
                                    }
                                }


                            }else{
                                if (sortAsc) {
                                    results.sort(function (a, b) {
                                        return b.rating - a.rating;
                                    });
                                }else if (sortDesc) {
                                    results.sort(function (a, b) {
                                        return a.rating - b.rating;
                                    });
                                }
                                addResultList(results[i], i);
                            }
                            markers[i].placeResult = results[i];


                            let moreButton = document.getElementById('more');
                            if (pagination.hasNextPage) {
                                moreButton.style.display = 'block';
                                moreButton.disabled = false;
                                moreButton.addEventListener('click', function() {
                                    moreButton.disabled = true;
                                    pagination.nextPage();
                                });
                            } else {
                                moreButton.style.display = '';
                            }
                        }
                    }
                    restSort();
                });
            }
            /*-----------------------------------------------------------------------------------
            resets the values
            -------------------------------------------------------------------------------------*/
            function clearMarkers() {
                for (var i = 0; i < markers.length; i++) {
                    if (markers[i]) {
                        markers[i].setMap(null);
                    }
                }
                markers = [];
            }
            function clearResults() {
                var results = document.getElementById('results');
                while (results.childNodes[0]) {
                    results.removeChild(results.childNodes[0]);
                }
            }
            /*-----------------------------------------------------------------------------------
            drops the markers onto the map
            -------------------------------------------------------------------------------------*/
            function dropMarker(i) {
                return function() {
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
                listDiv.onclick = function() {
                    google.maps.event.trigger(markers[i], 'click');
                };
                /*listDiv.onmousemove = function() {
                    google.maps.event.trigger(markers[i], 'mouseover', showInfoWindowSmall);
                };
                listDiv.mouseout = function() {
                    google.maps.event.trigger(markers[i], 'mouseout', closeInfoWindowSmall);
                };*/
                let details = `<div class="placeIcon"><img src ="${createPhoto(result)}" /></div>
                                <div class="placeDetails">
                                <div class="name">${result.name}</div>
                                <div class="rating">${starRating(result)}</div>
                                <a href="#restaurant-info" class="reviews-link">See Reviews</a>
                                </div>`;
                listDiv.insertAdjacentHTML("beforeEnd", details);
                resultsDiv.appendChild(listDiv);
            }
            /*-----------------------------------------------------------------------------------
            creates the photo from the api
            -------------------------------------------------------------------------------------*/
            function createPhoto(place) {
                var photos = place.photos;
                let photo;
                if (!photos) {
                    photo = place.icon;
                } else {
                    photo = photos[0].getUrl({
                        'maxWidth': 300,
                        'maxHeight': 170
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

            function showInfoWindowJSON() {
                closeInfoWindowSmall();
                let marker = this;
                    infoWindow.open(map, marker);
                    console.log(marker.id);
                    console.log(allRestaurants[marker.id]);
                    buildIWContent(allRestaurants[marker.id]);
                    displayRestaurantInfo(allRestaurants[marker.id]);
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
            function showInfoWindowSmallJSON() {
                closeInfoWindowSmall();
                let marker = this;

                infoWindowSmall.open(map, marker);
                buildIWContentSmall(allRestaurants[marker.id]);
            }
            function addRestaurantInfoWindow(){
                let marker = this;
                if(restaurantIsNew){
                    infoWindowNew.open(map, marker);
                    buildResDetailContent(marker);
                    newRestaurantMarker.push(marker);
                    newResNum += 1;
                }else{
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
                document.getElementById('website').innerHTML = '<b><a href="' + place.url + '">' + place.name + '</a></b>';
                let reviewsDiv = document.getElementById('reviews');
                let reviewHTML = '';
                reviewsDiv.html = reviewHTML;
                console.log(place);
                if(place.reviews){
                    if (place.reviews.length > 0) {
                        for (let i = 0; i < place.reviews.length; i += 1) {
                            let review = place.reviews[i];
                            let avatar;
                            if(place.reviews[i].profile_photo_url){
                                avatar = place.reviews[i].profile_photo_url;
                            }else{
                                avatar = 'img/avatar.png';
                            }
                            reviewHTML += `<div class="restaurant-reviews">
                                          <h3 class="review-title">
                                             <span class="profile-photo" style="background-image: url('${avatar}')"></span>
                                             <span id="review-rating" class="rating">${starRating(review)}</span>
                                          </h3>
                                          <p> ${place.reviews[i].text} </p>
                                        </div>`;
                            reviewsDiv.innerHTML = reviewHTML;
                        }
                    } else {
                        console.log('no reviews')
                    }
                }
                /*-----------------------------------------------------------------------------------
                adds the street view functionality
                -------------------------------------------------------------------------------------*/
                var panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'));
                var sv = new google.maps.StreetViewService();
                sv.getPanorama({
                    location: place.geometry.location,

                    radius: 50
                }, processSVData);
                console.log(place.geometry.location)
                function processSVData(data, status) {
                    if (status === 'OK') {
                        panorama.setPano(data.location.pano);
                        panorama.setPov({
                            heading: 270,
                            pitch: 0
                        });
                        panorama.setVisible(true);
                    } else {
                        console.error('Street View data not found for this location.');
                    }
                }
            }
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
            calls the sort by function
            -------------------------------------------------------------------------------------*/
            sortBy.addEventListener('change', function() {
                if (sortBy.value === 'ratingAsc') {
                    restSort();
                    sortAsc = true;
                    search();
                } else if (sortBy.value === 'ratingDesc') {
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
                document.getElementById('iw-url').innerHTML = '<b><a href="' + place.url + '">' + place.name + '</a></b>';
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
                    document.getElementById('iw-website').textContent = website;
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
                if (place.reviews) {
                    document.getElementById('iw-reviews').textContent = 'See Reviews'
                }
            }
            /*-----------------------------------------------------------------------------------
            Builds the new Restaurant info Window
            -------------------------------------------------------------------------------------*/
            function buildResDetailContent(marker){
                document.getElementById('form-add-restaurant').innerHTML =`
                    <h3 class="add-res-heading">Add A Restaruant</h3>
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
            document.getElementById("form-add-restaurant").addEventListener("submit", function(e) {
                e.preventDefault();
                let name = document.getElementById('res-name');
                let address = document.getElementById('res-address');
                let telephone = document.getElementById('res-telephone');
                let website = document.getElementById('res-website');
                let rating = document.getElementById('res-rating');
                let locationLat = document.getElementById('res-location-lat');
                let locationLng = document.getElementById('res-location-lng');

                let place = {
                    name: name.value,
                    vicinity: address.value,
                    website: website.value,
                    url: website.value,
                    formatted_phone_number: telephone.value,
                    rating: rating.value,
                    geometry:{location: {
                        lat: locationLat.value, //TODO need to fix
                        lng: locationLng.value  //TODO need to fix

                    }},
                    icon: 'https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png',
                    reviews: '',
                    photos: '',

                };
                /*-----------------------------------------------------------------------------------
                Pushes to array so that it knows which new restaurant to open when you add more than one
                -------------------------------------------------------------------------------------*/
                newPlace.push(place);
                //console.log(place.geometry.location);
                closeInfoWindowNew();
                let marker = newRestaurantMarker[newResNum];
                //console.log(newRestaurantMarker[0]);
                restaurantIsNew = false;
                infoWindow.open(map, marker);
                buildIWContent(place);
                displayRestaurantInfo(place);
            });
            /*-----------------------------------------------------------------------------------*/

        }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
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
document.getElementById("add-review").addEventListener("submit", function(e) {
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