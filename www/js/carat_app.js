var CaratApp = angular.module("CaratApp", ["ngRoute"]);

CaratApp.config(function($routeProvider) {
    $routeProvider
        .when('/home', {
            templateUrl: "home.html",
            controller: "TestController"
        })
        .when('/bugs', {
            templateUrl: "bugs.html",
            controller: "TestController"
        })
        .when('/hogs', {
            templateUrl: "hogs.html",
            controller: "TestController"
        })
        .when('/system', {
            templateUrl: "system.html",
            controller: "TestController"
        })
        .otherwise({
            redirectTo: "home.html"
        });
})
.controller('TestController', function($scope){});
