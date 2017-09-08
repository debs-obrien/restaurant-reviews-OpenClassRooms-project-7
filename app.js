var map;
var infoWindow;



function initMap() {
    var palma = new google.maps.LatLng(39.5696, 2.6502);
    var test = new google.maps.LatLng(33.5696, 2.6502);
    map = new google.maps.Map(document.getElementById('map'), {
        center: palma,
        zoom: 14
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

            /*function callback(results, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    for (var i = 0; i < results.length; i++) {
                        var place = results[i];
                        createMarker(results[i]);
                        var request = {
                            "placeId":results[i]['place_id']
                        };

                        service.getDetails(request, callback2);
                        function callback2(details, status) {
                            console.log(details);

                            if (status === google.maps.places.PlacesServiceStatus.OK) {
                                for (var i = 0; i < results.length; i++) {
                                    createMarker(results[i]);
                                }
                            }
                        }
                    }
                    console.log(results.length);

                }
                //service.textSearch(request, callback);


            }*/

            function callback(results, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    results.forEach(createMarker);
                    function displayRestaurants(){
                        for(let i=0; i<results.length; i+=1){
                            let restaurantDiv = document.getElementById('all-restaurants');
                            let restaurant = document.createElement('div');
                            restaurantDiv.appendChild(restaurant);
                            restaurant.textContent+= results[i].name
                        }

                    }
                    results.forEach(displayRestaurants);
                }
            }

            function createMarker(place) {
                console.log(place);
                var photos = place.photos;
                if (!photos) {
                    return;
                }
                var placeLoc = place.geometry.location;
                var marker = new google.maps.Marker({
                    map: map,
                    position: place.geometry.location
                });

                google.maps.event.addListener(marker, 'click', function() {
                    var request = {
                        placeId: place.place_id
                    };

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
                    var panorama = new google.maps.StreetViewPanorama(
                        document.getElementById('pano'), {
                            position: place.geometry.location
                            

                        });
                    map.setStreetView(panorama);

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



