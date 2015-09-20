var CaratApp = angular.module("CaratApp", ["ngRoute"]);

CaratApp.config(function($routeProvider) {
    $routeProvider
        .when('/home', {
            templateUrl: "home.html"
        })
        .when('/bugs', {
            templateUrl: "bugs.html"
        })
        .when('/hogs', {
            templateUrl: "hogs.html"
        })
        .when('/system', {
            templateUrl: "system.html"
        })
        .otherwise({
            redirectTo: "home.html"
        });
});
