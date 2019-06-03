'use strict';

describe("test network demo controller", function(){

    beforeEach(module("myApp"));

    var $controller;
    var $rootScope;
    var bcNetworkProvider;
    var bcNetwork;
    var w1, w2, m1, m2;

    beforeEach(function() {
        module(function(bitcoinNetworkProvider) {
            bcNetworkProvider = bitcoinNetworkProvider;

            w1 = bitcoinNetworkProvider.createWallet("Alice",[
                {amount: 20},
                {amount: 10},
                {amount: 5},
                {amount: 50},
                {amount: 20},
            ]);
            w2 = bitcoinNetworkProvider.createWallet("Bob", []);
            m1 = bitcoinNetworkProvider.createMiner("Eve",[]);
            m2 = bitcoinNetworkProvider.createMiner("Tom",[]);

            bitcoinNetworkProvider.createBitcoinNetwork([w1,w2], [m1,m2]);
        });

        inject(function(_bitcoinNetwork_) {
            bcNetwork = _bitcoinNetwork_;
        });
    });

    beforeEach(inject(function(_$controller_, _$rootScope_){

        $controller = _$controller_;
        $rootScope = _$rootScope_;
    }));

    describe("sendValidBlock", function(){
        var $scope, controller;
        var receivedBlock;

        beforeEach(function() {
            $scope = $rootScope;
            controller = $controller('NetworkDemoController', { $scope: $scope, bitcoinNetwork: bcNetwork});
            bcNetwork.addListener({onNewBlock: function (block) {
                    receivedBlock = block;
            }});
        });

        it('sent block is marked as dummy block', function() {
            $scope.sendValidBlock();
            expect(receivedBlock.isDummy).toEqual(true);
        });

        it('sent block is valid', function() {
            $scope.sendValidBlock();
            expect(receivedBlock.isValid()).toEqual(true);
        });
    });

    describe("sendInvalidBlock", function(){
        var $scope, controller;
        var receivedBlock;
        beforeEach(function() {
            $scope = $rootScope;
            controller = $controller('NetworkDemoController', { $scope: $scope, bitcoinNetwork: bcNetwork});
            bcNetwork.addListener({onNewBlock: function (block) {
                    receivedBlock = block;
                }});
        });

        it('sent block is marked as dummy block', function() {
            $scope.sendInvalidBlock();
            expect(receivedBlock.isDummy).toEqual(true);
        });

        it('sent block is invalid', function() {
            $scope.sendInvalidBlock();
            expect(receivedBlock.isValid()).toEqual(false);
        });
    });
});