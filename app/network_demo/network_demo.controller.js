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
        $scope.sendValidBlock = function () {
            bitcoinNetwork.propagateBlock({minedBy:1, isValid: function () {
                    return true;
                }});
        };

        $scope.sendInvalidBlock = function () {
            bitcoinNetwork.propagateBlock(
                {minedBy:1,
                        isValid: function () {
                            return false;
                        },
                        isDummy: true
                    }
                );
        };


    }]);