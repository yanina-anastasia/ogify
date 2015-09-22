/**
 * Created by melge on 12.07.2015.
 */

var ogifyApp = angular.module('ogifyApp', ['ogifyServices', 'ngRoute', 'ngCookies', 'uiGmapgoogle-maps']);

ogifyApp.config(function ($routeProvider, uiGmapGoogleMapApiProvider) {
    $routeProvider
        .when('/current', {
            templateUrl: 'templtes/current.html'
        }).when('/dashboard', {
            templateUrl: 'templates/dashboard.html',
            controller: 'DashboardController'
        }).otherwise({
            redirectTo: '/dashboard'
        });

    uiGmapGoogleMapApiProvider.configure({
        key: 'AIzaSyB3JGdwrXd_unNoKWm8wLWzWO2NTjMZuHA',
        v: '3.17',
        libraries: 'weather,geometry,visualization'
    });
});

ogifyApp.run(function ($rootScope, $http) {
    $rootScope.navBarTemplateUri = 'templates/navbar/navbar.html';
    $rootScope.createOrderTemplateUri = 'templates/new-order.html'

    $rootScope.$watch(function () {
        return $http.pendingRequests.length > 0;
    }, function (v) {
        if (v) {
            waitingDialog.show();
        } else {
            waitingDialog.hide();
        }
    });
});

ogifyApp.controller('NavBarController', function ($scope, $window, $cookies, AuthResource, UserProfile, Order) {

    $scope.modalWindowTemplateUri = 'templates/navbar/auth-modal.html';

    //$scope.authenticationStatus = AuthResource.authenticationStatus();

    $scope.authVk = function () {
        AuthResource.getVkUri(function (data) {
            $window.location.href = data.requestUri;
        });
    };

    $scope.logoutSN = function () {
        $cookies.remove("JSESSIONID");
        $cookies.remove("ogifySessionSecret");
        $cookies.remove("sID");

        $window.location.reload();
    };

    $scope.updateOrderData = function() {
        //TODO fix this hack
        //hack invokes controller update my position in Order form
    };

    $scope.createOrder = function() {
        var neworder = {
            svekla : 'heyhey',
            morkov : 'nounou'
        };
        Order.create(neworder);
    };

    $scope.user = UserProfile.getCurrentUser();
});

ogifyApp.controller('DashboardController', function ($rootScope, $scope, uiGmapGoogleMapApi, Order) {
    //group orders as is
    var groupExistingOrdersByLocation = function(ordersList) {
        var outputOrders = [];
        var gap = 0.02;
        var groupCounter = 0;
        for(order in ordersList){
            for(var i = 0; i < outputOrders.length; i++){
                if(ordersList[order].latitude - outputOrders[i].latitude < gap && ordersList[order].longitude - outputOrders[i].longitude < gap){
                    //adding to group
                    outputOrders[i].orders.push(ordersList[order]);
                    break;
                }
            }
            //creating new Group of orders
            var newGroup = {
                id: "group" + groupCounter,
                orders: [ordersList[order]],
                longitude: ordersList[order].longitude,
                latitude : ordersList[order].latitude
            };
            outputOrders.push(newGroup);
            groupCounter++;
        }
        return outputOrders;
    };

    $scope.currentUserOrders = Order.query();
    Order.query(function(result) {
        $scope.currentUserOrdersOnMap = groupExistingOrdersByLocation(result);
    });

    $rootScope.map = {
        center: { latitude: 55.7, longitude: 37.6 },
        zoom: 10,
        control: {},
        center_address: ""
    };

    uiGmapGoogleMapApi.then(function(maps) {
        $scope.maps = maps;
        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                $scope.map.center = { latitude: position.coords.latitude, longitude: position.coords.longitude };

                var geocoder = new google.maps.Geocoder();
                var myposition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                geocoder.geocode({'latLng': myposition},function(data,status) {
                    if(status == google.maps.GeocoderStatus.OK)
                        $scope.map.center_address = data[0].formatted_address; //this is the full address
                });

                $scope.map.control.refresh($scope.map.center);
                $scope.map.zoom = 11;

                //personal marker init
                $scope.selfMarker = {
                    options: {
                        draggable: true,
                        animation: google.maps.Animation.DROP,
                        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                    },
                    coords: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    },
                    events: {
                        dragend: function (marker, eventName, args) {
                            var lat = marker.getPosition().lat();
                            var lon = marker.getPosition().lng();

                            var geocoder = new google.maps.Geocoder();
                            var myposition = new google.maps.LatLng(lat, lon);
                            geocoder.geocode({'latLng': myposition},function(data,status) {
                                if(status == google.maps.GeocoderStatus.OK)
                                    $scope.map.center_address = data[0].formatted_address;
                            });
                        }
                    },
                    id: "currentPosition"
                };
            });
        }
    });
});

ogifyApp.controller('CreateOrderModalController', function ($scope) {

});