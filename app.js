"use strict";
var map;
var infoWindow;

function initMap() {
    var palma = new google.maps.LatLng(39.5696, 2.6502);
    var test = new google.maps.LatLng(33.5696, 2.6502);
    map = new google.maps.Map(document.getElementById('map'), {
        center: palma,
        zoom: 14,
        streetViewControl: false
    });


    infoWindow = new google.maps.InfoWindow({});

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };


            infoWindow.setPosition(pos);
            //infoWindow.setContent('You are here');
            //infoWindow.open(map);
            map.setCenter(pos);

            var marker = new google.maps.Marker({
                position: pos,
                //icon:'img/person.png'
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
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function() {
                marker.setAnimation(null)
            }, 4000);
            marker.setMap(map);

            var infowindow = new google.maps.InfoWindow();
            var service = new google.maps.places.PlacesService(map);
            service.nearbySearch({
                location: pos,
                radius: 3000,
                type: ['restaurant']
            }, callback);

            function displayRestaurants(results){
                for(let i=0; i<results.length; i+=1){
                    let restaurantDiv = document.getElementById('all-restaurants');
                    let restaurant = document.createElement('div');
                    restaurantDiv.appendChild(restaurant);
                    restaurant.setAttribute("class", 'restaurant');
                    restaurant.setAttribute("resId", results[i].id);
                    restaurant.textContent+= results[i].name;
                    restaurant.addEventListener('click', function() {

                        console.log(results[i].name)
                        var place= results[i];

                        var marker = new google.maps.Marker({
                            map: map,
                            position: place.geometry.location
                        });

                            var request = {
                                placeId: place.place_id
                            };
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

                            service.getDetails(request, function (details, status) {
                                console.log(details);
                                infowindow.setContent([
                                    details.name,
                                    details.html_attributions.icon,
                                    details.formatted_address,
                                    details.website,
                                    details.reviews[0].rating,
                                    details.formatted_phone_number].join("<br />"));
                                infowindow.open(map, marker);

                                document.getElementById('name').textContent = details.name;
                                console.log(details.name)
                            });

                        });



                }

            }
            function callback(results, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    results.forEach(createMarker);
                    displayRestaurants(results);
                }
            }

            function createMarker(place) {
                console.log(place);

                //var placeLoc = place.geometry.location;
                var marker = new google.maps.Marker({
                    map: map,
                    position: place.geometry.location
                });


                google.maps.event.addListener(marker, 'click', function() {
                    var request = {
                        placeId: place.place_id
                    };
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
                    service.getDetails(request, function(details, status) {
                        console.log(details);
                        infowindow.setContent([
                            details.name,
                            details.html_attributions.icon,
                            details.formatted_address,
                            details.website,
                            details.reviews[0].rating,
                            details.formatted_phone_number].join("<br />"));
                        infowindow.open(map, marker);

                        document.getElementById('name').textContent= details.name;
                        console.log(details.name)
                    });

                });

            }



        }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }

}



