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
            infoWindow.setContent('You are here');
            infoWindow.open(map);
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


            var service = new google.maps.places.PlacesService(map);
            service.nearbySearch({
                location: pos,
                radius: 3000,
                type: ['restaurant']
            }, callback);

            function callback(results, status) {
                console.log(results);
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    for (var i = 0; i < results.length; i++) {
                        var place = results[i];
                        //console.log(place); //gives all places
                        createMarker(results[i]);
                        var request = {
                            "placeId":results[i]['place_id']
                        };
                        //console.log(request);//gives all ids

                        service.getDetails(request, callback2);
                        var restaurants = results.length; //need this in function below

                        function callback2(results, status) {
                            for(var x = 0; x < restaurants.length; x++) {
                                console.log(results);//gives back nothing
                                //restaurants needs to be passed into function
                                //but i tried and it didnt work
                            }
                            console.log(results);//this gives me what i want but only one
                            if (status === google.maps.places.PlacesServiceStatus.OK) {
                                for (var i = 0; i < results.length; i++) {
                                    createMarker(results[i]);
                                    //console.log(results[i]);
                                }
                            }
                        }
                    }
                    console.log(results.length);

                }
                //service.textSearch(request, callback);


            }

            function createMarker(place) {
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
                    infoWindow.setContent('<div><strong>' + place.name + '</strong>' +
                        'Place ID: ' + place.place_id + place.icon + place.rating + place.vicinity + place.types+'</div>');
                    infoWindow.open(map, this);
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



