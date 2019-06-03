'use strict';

describe("test wallet demo controller", function(){

    beforeEach(module("myApp"));

    var $controller;
    var $rootScope;
    var bcNetworkProvider;
    var bcNetwork;
    var w1, w2, m1, m2, m3;

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

    describe("getHash", function(){
        var $scope, controller;

        var interval = function(callback) { return callback; };

        beforeEach(function() {
            $scope = $rootScope;
            controller = $controller('MinerDemoController', { $scope: $scope, $interval: interval, bitcoinNetwork: bcNetwork});

        });

        it('returns correct sha256 hash', function() {
            expect($scope.getHash("test")).toEqual("9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08");
        });
    });

    describe("isMiningInProgress", function(){
        var $scope, controller;

        var interval = function(callback) { return callback; };

        beforeEach(function() {
            $scope = $rootScope;
            controller = $controller('MinerDemoController', { $scope: $scope, $interval: interval, bitcoinNetwork: bcNetwork});
            $scope.stopToMineBlock = function(){};
        });

        it('returns false when mining is not running', function() {
            expect($scope.isMiningInProgress()).toEqual(false);
        });

        it('returns true after mining was started', function() {
            $scope.startToMineBlock();
            expect($scope.isMiningInProgress()).toEqual(true);
        });

        it('returns true after mining competition was started', function() {
            $scope.startToMiningCompetition();
            expect($scope.isMiningInProgress()).toEqual(true);
        });
    });

    describe("checkIfTransactionsArePresent", function(){
        var $scope, controller;

        var interval = function(callback) { return callback; };

        beforeEach(function() {
            $scope = $rootScope;
            controller = $controller('MinerDemoController', { $scope: $scope, $interval: interval, bitcoinNetwork: bcNetwork});

        });

        it('is true if all miner have transactions in mempool', function() {
            $scope.generateTransactionForAllMiners();

            expect($scope.checkIfTransactionsArePresent()).toEqual(true);
        });

        it('is false when no miner has transactions in mempool', function() {

            expect($scope.checkIfTransactionsArePresent()).toEqual(false);
        });

        it('is false when some miners have no transactions in mempool', function() {
            $scope.generateTransactionForAllMiners();
            m1.mempool.length = 0;
            expect($scope.checkIfTransactionsArePresent()).toEqual(false);
        });
    });


});