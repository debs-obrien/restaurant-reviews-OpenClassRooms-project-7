"use strict";
var map;
var infoWindow;
let infoWindowSmall;
var markers = [];
var autocomplete;
var autocompleteRestaurant;
var hostnameRegexp = new RegExp('^https?://.+?/');
var restaurantInfoDiv = document.getElementById('restaurant-info');
restaurantInfoDiv.style.display = "none";
let sortAsc = false;
let sortDesc = false;
let sort4Star = false;

function starRating(place){
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


function initMap() {
    var palma = new google.maps.LatLng(39.5696, 2.6502);
    map = new google.maps.Map(document.getElementById('map'), {
        center: palma,
        zoom: 14,
        streetViewControl: false
    });


    infoWindow = new google.maps.InfoWindow({
        content: document.getElementById('info-content')
    });
    infoWindowSmall = new google.maps.InfoWindow({
        content: document.getElementById('info-content-small'),

    });

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
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
                        zIndex:1
                    },
                    draggable:true
                }
            );
            //adds animation to the circle of where you are
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function() {
                marker.setAnimation(null)
            }, 4000);
            marker.setMap(map);


            var infowindow = new google.maps.InfoWindow();
            var service = new google.maps.places.PlacesService(map);
            service.nearbySearch({
                location: pos,
                radius: 1000,
                type: ['restaurant']
            }, callback);

            function callback(results, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    search()
                }
            }

            // Create the autocomplete object and associate it with the UI input control.
            autocomplete = new google.maps.places.Autocomplete(
                /** @type {!HTMLInputElement} */ (
                    document.getElementById('autocomplete-input')), {
                    types: ['(cities)'],
                });

            autocompleteRestaurant = new google.maps.places.Autocomplete(
                /** @type {!HTMLInputElement} */ (
                    document.getElementById('autocompleteRestaurant-input')), {
                    types: ['establishment']
                });

            var places = new google.maps.places.PlacesService(map);

            //on entering a city or restaurant call onPlaceChanged function to search again
            autocomplete.addListener('place_changed', onPlaceChanged);
            autocompleteRestaurant.addListener('place_changed', onPlaceChanged2);

            //if the map is dragged search again
            map.addListener('dragend', function() {
                search();
            });
            //right clicking adds
            map.addListener('rightclick', function(e) {
                console.log('add');

            });



            google.maps.event.trigger(map, 'resize');


            // When the user selects a city, get the place details for the city and
            // zoom the map in on the city.
            function onPlaceChanged() {
                var place = autocomplete.getPlace();
                if (place.geometry) {
                    map.panTo(place.geometry.location);
                    map.setZoom(15);
                    search();
                } else {
                    document.getElementById('autocomplete').placeholder = 'Search for a City';
                }
            }
            function showInfoWindow2(place) {
                places.getDetails({placeId: place.id},
                    function (place, status) {
                        if (status !== google.maps.places.PlacesServiceStatus.OK) {
                            return;
                        }
                        infoWindow.open(map, place);
                        buildIWContent(place);
                        displayRestaurantInfo(place);
                    });
            }
            function onPlaceChanged2() {
                let place = autocompleteRestaurant.getPlace();
                if (place.geometry) {
                    map.panTo(place.geometry.location);
                    map.setZoom(15);
                    search();

                } else {
                    document.getElementById('autocompleteRestaurant').placeholder = 'Search for a Restaurant';
                }
                showInfoWindow2(place)
            }
            //displays extra info below when restaurant is clicked
            function displayRestaurantInfo(place){
                showTheForm();
                restaurantInfoDiv.style.display = "block";
                document.getElementById('name').textContent = place.name;
                document.getElementById('address').textContent = place.vicinity;
                document.getElementById('telephone').textContent = place.formatted_phone_number;
                document.getElementById('website').innerHTML = '<b><a href="' + place.url +
                    '">' + place.name + '</a></b>';

                let reviewsDiv = document.getElementById('reviews');
                let reviewHTML = '';
                reviewsDiv.html = reviewHTML;
                console.log(place);
                if(place.reviews.length >0){
                    for(let i=0; i<place.reviews.length; i+=1){
                        let review = place.reviews[i];
                        reviewHTML += `<div class="restaurant-reviews">
                                                                  <h3 class="review-title">
                                                                  <span class="profile-photo" style="background-image: url('${place.reviews[i].profile_photo_url}')"></span>
                                                                  <span id="review-rating" class="rating">${starRating(review)}</span>
                                                                  </h3>
                                                                  <p> ${place.reviews[i].text} </p>
                                                               </div>`;
                        reviewsDiv.innerHTML = reviewHTML;
                    }
                }else{
                    console.log('no reviews')
                }

                //adds the street view functionality
                var panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'));
                var sv = new google.maps.StreetViewService();
                sv.getPanorama({location: place.geometry.location, radius: 50}, processSVData);

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
            //creates the marker icon with stars. if no stars gives a default icon
            function createMarkerStars(result){
                let rating = Math.round(result.rating);
                let markerIcon;
                if(isNaN(rating)){
                    markerIcon = 'img/' + 'marker_default.png';
                }else{
                    markerIcon = 'img/' + 'marker_' + rating + '.png';
                }
                return markerIcon;
            }
            function createPhoto(place) {
                var photos = place.photos;
                let photo;
                if (!photos) {
                    photo = place.icon;
                }else{
                    photo = photos[0].getUrl({'maxWidth': 300, 'maxHeight': 170});
                }
                return photo;
            }


            let sortBy = document.getElementById('sort');
            sortBy.addEventListener('change', function() {
                if(sortBy.value === 'ratingAsc'){
                    sortAsc = true;
                    sortDesc = false;
                    search();
                }else if(sortBy.value === 'ratingDesc'){
                    sortDesc = true;
                    sortAsc = false;
                    search();
                }

            });

            // Search for restaurants in the selected city, within the viewport of the map.
            function search() {
                let search = {
                    bounds: map.getBounds(),
                    type: ['restaurant']

                };

                places.nearbySearch(search, function (results, status, pagination) {
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        clearResults();
                        clearMarkers();

                        for (let i = 0; i < results.length; i++) {
                            //createMarkerStars(results);
                            markers[i] = new google.maps.Marker({
                                position: results[i].geometry.location,
                                animation: google.maps.Animation.DROP,
                                icon: createMarkerStars(results[i]),
                                zIndex:52
                            });

                            // If the user clicks a restaurant marker, show the details of that restaurant
                            //markers[i].placeResult = results[i];
                            google.maps.event.addListener(markers[i], 'click', showInfoWindow);
                            google.maps.event.addListener(markers[i], 'mouseover', showInfoWindowSmall);
                            google.maps.event.addListener(markers[i], 'mouseout', closeInfoWindowSmall);
                            google.maps.event.addListener(map, "click", closeInfoWindow);

                            setTimeout(dropMarker(i), i * 100);

                            if(sortAsc){
                                results.sort(function (a, b) {
                                    return b.rating - a.rating;
                                });

                            }else if(sortDesc){
                                results.sort(function (a, b) {
                                    return a.rating - b.rating;
                                });
                            }else if(sort4Star){
                                let rating = Math.round(results.rating);
                                if(results.hasOwnProperty('rating')){
                                    return results
                                }
                                console.log(rating)

                            }
                            addResultList(results[i], i);
                            markers[i].placeResult = results[i];

                        }
                        let moreButton = document.getElementById('more');
                        if (pagination.hasNextPage) {
                            moreButton.style.display = 'block';
                            moreButton.disabled = false;
                            moreButton.addEventListener('click', function() {
                                moreButton.disabled = true;
                                pagination.nextPage();
                            });
                        }else{
                            moreButton.style.display = '';
                        }

                        sortDesc = false;
                        sortAsc = false;
                    }
                });
            }


            function closeInfoWindow(){
                infoWindow.close(map, marker);
            }
            function closeInfoWindowSmall(){
                infoWindowSmall.close(map, marker);
            }

            function clearMarkers() {
                for (var i = 0; i < markers.length; i++) {
                    if (markers[i]) {
                        markers[i].setMap(null);
                    }
                }
                markers = [];
            }


            function dropMarker(i) {
                return function () {
                    markers[i].setMap(map);
                };
            }

            function addResultList(result, i) {

                let results = document.getElementById('results');
                let listDiv = document.createElement('div');
                listDiv.setAttribute('class', 'results-list');
                //listDiv.style.backgroundColor = (i % 2 === 0 ? '#F0F0F0' : '#FFFFFF');
                listDiv.onclick = function () {
                    google.maps.event.trigger(markers[i], 'click');
                };
                listDiv.onmousemove = function(){
                    google.maps.event.trigger(markers[i], 'mouseover', showInfoWindowSmall);
                };
                listDiv.mouseout = function(){
                    google.maps.event.trigger(markers[i], 'mouseout', closeInfoWindowSmall);
                };

                let details = `<div class="placeIcon"><img src ="${createPhoto(result)}" /></div>
                                <div class="placeDetails">
                                <div class="name">${result.name}</div>
                                <div class="rating">${starRating(result)}</div>
                                <a href="#restaurant-info" class="reviews-link">See Reviews</a>
                                </div>`;
                listDiv.insertAdjacentHTML("beforeEnd", details);

                results.appendChild(listDiv);
            }


            function clearResults() {
                var results = document.getElementById('results');
                while (results.childNodes[0]) {
                    results.removeChild(results.childNodes[0]);
                }
            }

            // Get the place details for a restaurant. Show the information in an info window,
            // anchored on the marker for the restaurant that the user selected.
            function showInfoWindow() {
                closeInfoWindowSmall();
                let marker = this;
                places.getDetails({placeId: marker.placeResult.place_id},
                    function (place, status) {
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
                places.getDetails({placeId: marker.placeResult.place_id},
                    function (place, status) {
                        if (status !== google.maps.places.PlacesServiceStatus.OK) {
                            return;
                        }
                        infoWindowSmall.open(map, marker);
                        buildIWContentSmall(place);
                    });
            }

            function buildIWContentSmall(place) {
                document.getElementById('iw-icon-small').innerHTML = '<img class="photo" ' +
                    'src="' + createPhoto(place) + '"/>';
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


            // Load the place information into the HTML elements used by the info window.
            function buildIWContent(place) {

                console.log(place);
                document.getElementById('iw-icon').innerHTML = '<img class="photo" ' +
                    'src="' + createPhoto(place) + '"/>';
                document.getElementById('iw-url').innerHTML = '<b><a href="' + place.url +
                    '">' + place.name + '</a></b>';
                document.getElementById('iw-address').textContent = place.vicinity;

                if (place.formatted_phone_number) {
                    document.getElementById('iw-phone').style.display = '';
                    document.getElementById('iw-phone').textContent =
                        place.formatted_phone_number;
                } else {
                    document.getElementById('iw-phone').style.display = 'none';
                }

                // Assign a five-star rating to the restaurant, using a coloured star ('&#10029;')
                // to indicate the rating the restaurant has earned, and a white star ('&#10025;')
                // for the rating points not achieved.
                if (place.rating) {
                    var ratingHtml = '';
                    for (var i = 0; i < 5; i++) {
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

                // The regexp isolates the first part of the URL (domain plus subdomain)
                // to give a short URL for displaying in the info window.
                if (place.website) {
                    var fullUrl = place.website;
                    var website = hostnameRegexp.exec(place.website);
                    if (website === null) {
                        website = 'http://' + place.website + '/';
                        fullUrl = website;
                    }
                    document.getElementById('iw-website').style.display = '';
                    document.getElementById('iw-website').textContent = website;
                } else {
                    document.getElementById('iw-website').style.display = 'none';
                }
                if(place.opening_hours){
                    if (place.opening_hours.open_now) {
                        document.getElementById('iw-open').style.display = '';
                        document.getElementById('iw-open').textContent = 'Open Now';
                    } else {
                        document.getElementById('iw-open').style.display = 'none';
                    }
                }
                if(place.reviews){
                    document.getElementById('iw-reviews').textContent = 'See Reviews'
                }

            }}, function() {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }
}

let newReviewArray = [];

function showTheForm(){
    document.getElementById("form-wrapper").style.display = 'block';
    document.getElementById("add-review-button").style.display = 'block';
}

function hideTheForm(){
    document.getElementById("form-wrapper").style.display = 'none';
    document.getElementById("add-review-button").style.display = 'none';
}

document.getElementById("add-review").addEventListener("submit", function (e) {
    e.preventDefault();
    let newName = document.getElementById("your-name");
    let newRating = document.getElementById("your-rating");
    let newReview = document.getElementById("your-review");

    if (!(newName.value && newRating.value && newReview.value)) { //if not empty return
        return;
    }

    addReview(newName.value, newRating.value, newReview.value);//add to array values from form
    newName.value = "";   //reset form values to 0
    newRating.value = "";
    newReview.value = "";
    hideTheForm();     //hide form and add button
});


function addReview(newName, newRating, newReview){ //add to array and to the page
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