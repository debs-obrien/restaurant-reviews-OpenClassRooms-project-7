"use strict";
var map;
var infoWindow;
var markers = [];
var autocomplete;
var MARKER_PATH = 'https://developers.google.com/maps/documentation/javascript/images/marker_green';
var hostnameRegexp = new RegExp('^https?://.+?/');
let restaurantInfoDiv = document.getElementById('restaurant-info');
restaurantInfoDiv.style.display = "none";

function initMap() {
    var palma = new google.maps.LatLng(39.5696, 2.6502);
    var test = new google.maps.LatLng(33.5696, 2.6502);
    map = new google.maps.Map(document.getElementById('map'), {
        center: palma,
        zoom: 14,
        streetViewControl: false
    });


    infoWindow = new google.maps.InfoWindow({
        content: document.getElementById('info-content')
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
                        strokeWeight: 1
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
                    document.getElementById('autocomplete')), {
                    types: ['(cities)'],
                });

            var places = new google.maps.places.PlacesService(map);

            //on entering a city call onPlaceChanged function to search again
            autocomplete.addListener('place_changed', onPlaceChanged);

            //if the map is dragged search again
            map.addListener('drag', function() {
                search();
            });
            // When the user selects a city, get the place details for the city and
            // zoom the map in on the city.
            function onPlaceChanged() {
                //displayRestaurants(results);
                var place = autocomplete.getPlace();
                if (place.geometry) {
                    map.panTo(place.geometry.location);
                    map.setZoom(15);
                    search();
                } else {
                    document.getElementById('autocomplete').placeholder = 'Search for a Restaurant';
                }
            }
            //displays extra info below when restaurant is clicked
            function displayRestaurantInfo(place){
                restaurantInfoDiv.style.display = "block";
                document.getElementById('name').textContent = place.name;
                let reviewsDiv = document.getElementById('reviews');
                let reviewHTML = '';
                reviewsDiv.html = reviewHTML;
                console.log(place);
                if(place.reviews.length >0){
                    for(let i=0; i<place.reviews.length; i+=1){
                        let review = place.reviews[i];
                        reviewHTML += `<div>
                                                                  <h3 class="review-title">
                                                                  <span class="profile-photo" style="background-image: url('${place.reviews[i].profile_photo_url}')"></span>
                                                                  <span class="rating">${review.rating} Star Rating</span>
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
                let rating = Math.ceil(result.rating);
                let markerIcon;
                if(isNaN(rating)){
                    markerIcon = 'img/' + 'marker_default.png';
                }else{
                    markerIcon = 'img/' + 'marker_' + rating + '.png';
                }
                return markerIcon;
            }

            // Search for restaurants in the selected city, within the viewport of the map.
            function search() {
                var search = {
                    bounds: map.getBounds(),
                    type: ['restaurant']
                };

                places.nearbySearch(search, function (results, status) {
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        clearResults();
                        clearMarkers();
                        // Create a marker for each restaurant found, and
                        // assign a letter of the alphabetic to each marker icon.
                        for (var i = 0; i < results.length; i++) {
                            createMarkerStars(results);
                            //var markerLetter = String.fromCharCode('A'.charCodeAt(0) + (i % 26));
                            //var markerIcon = MARKER_PATH + markerLetter + '.png';
                            // Use marker animation to drop the icons incrementally on the map.
                            markers[i] = new google.maps.Marker({
                                position: results[i].geometry.location,
                                animation: google.maps.Animation.DROP,
                                icon: createMarkerStars(results[i])
                            });
                            // If the user clicks a restaurant marker, show the details of that restaurant
                            // in an info window.
                            markers[i].placeResult = results[i];
                            google.maps.event.addListener(markers[i], 'click', showInfoWindow);
                            setTimeout(dropMarker(i), i * 100);
                            addResult(results[i], i);
                        }
                    }
                });
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

            function addResult(result, i) {
                var results = document.getElementById('results');
                var tr = document.createElement('tr');
                tr.style.backgroundColor = (i % 2 === 0 ? '#F0F0F0' : '#FFFFFF');
                tr.onclick = function () {
                    google.maps.event.trigger(markers[i], 'click');
                };

                var iconTd = document.createElement('td');
                var nameTd = document.createElement('td');
                var icon = document.createElement('img');
                icon.src = createMarkerStars(result);
                icon.setAttribute('class', 'placeIcon');
                icon.setAttribute('className', 'placeIcon');
                var name = document.createTextNode(result.name);
                iconTd.appendChild(icon);
                nameTd.appendChild(name);
                tr.appendChild(iconTd);
                tr.appendChild(nameTd);
                results.appendChild(tr);
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

                var marker = this;
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

            // Load the place information into the HTML elements used by the info window.
            function buildIWContent(place) {
                console.log(place)
                document.getElementById('iw-icon').innerHTML = '<img class="hotelIcon" ' +
                    'src="' + place.icon + '"/>';
                document.getElementById('iw-url').innerHTML = '<b><a href="' + place.url +
                    '">' + place.name + '</a></b>';
                document.getElementById('iw-address').textContent = place.vicinity;

                if (place.formatted_phone_number) {
                    document.getElementById('iw-phone-row').style.display = '';
                    document.getElementById('iw-phone').textContent =
                        place.formatted_phone_number;
                } else {
                    document.getElementById('iw-phone-row').style.display = 'none';
                }

                // Assign a five-star rating to the restaurant, using a black star ('&#10029;')
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
                        document.getElementById('iw-rating-row').style.display = '';
                        document.getElementById('iw-rating').innerHTML = ratingHtml;
                    }
                } else {
                    document.getElementById('iw-rating-row').style.display = 'none';
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
                    document.getElementById('iw-website-row').style.display = '';
                    document.getElementById('iw-website').textContent = website;
                } else {
                    document.getElementById('iw-website-row').style.display = 'none';
                }
                if (place.opening_hours.open_now) {
                    document.getElementById('iw-open-row').style.display = '';
                    document.getElementById('iw-open').textContent = 'Open Now';
                } else {
                    document.getElementById('iw-website-row').style.display = 'none';
                }

            }}, function() {
                handleLocationError(true, infoWindow, map.getCenter());
            });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }
            }
