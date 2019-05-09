'use strict';

angular
    .module('myApp')
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/startpage', {
            templateUrl: 'startpage/view.html',
            controller: 'StartpageController'
        });
    }])
    .controller('StartpageController', ['$scope', function($scope) {
        $scope.hashText="Beispiel der Hash Funktion.";

        $scope.getHash = function(value) {
            return sha256(value);
        };

    }]);