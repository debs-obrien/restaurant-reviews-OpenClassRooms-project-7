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
                icon:'img/person.png'}
            );
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function() {
                marker.setAnimation(null)
            }, 4000);
            marker.setMap(map);


            var service = new google.maps.places.PlacesService(map);
            service.nearbySearch({
                location: pos,
                radius: 1000,
                type: ['restaurant']
            }, callback);
            //service.textSearch(request, callback);
            var request = {
                placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
                url: '',
                reviews:'',
                formatted_address:''
            };
            service.getDetails(request, callback);
            function callback(results, status) {
                console.log(results);
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    for (var i = 0; i < results.length; i++) {
                        createMarker(results[i]);
                    }
                }
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



