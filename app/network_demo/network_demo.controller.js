'use strict';

angular
    .module('myApp')
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/network_demo', {
            templateUrl: 'network_demo/view.html',
            controller: 'NetworkDemoController'
        });
    }])
    .controller('NetworkDemoController', ['$scope', 'bitcoinNetwork', function($scope, bitcoinNetwork) {

    }]);