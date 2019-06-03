'use strict';

describe("test wallet demo controller", function(){

    beforeEach(module("myApp"));

    var $controller;
    var $rootScope;

    beforeEach(inject(function(_$controller_, _$rootScope_){

        $controller = _$controller_;
        $rootScope = _$rootScope_;
    }));

    describe("getHash", function(){
        var $scope, controller;

        beforeEach(function() {
            $scope = $rootScope;
            controller = $controller('StartpageController', { $scope: $scope});

        });

        it('returns correct sha256 hash', function() {
            expect($scope.getHash("test")).toEqual("9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08");
        });
    });


});