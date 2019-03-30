'use strict';

describe("test wallet demo controller", function(){

    beforeEach(module("myApp"));

    var createTransactionCalled = false;
    var propagateTransactionCalled = false;

    var bitcoinNetwork = {
        getWallets: function() {
            return [
                {
                    address:1,
                    utxos:[{amount: 20}, {amount: 15},{amount: 5}]
                },
                {
                    address:2,
                    utxos:[{amount: 10}]
                }
            ];
        },

        getMiners: function() { return []; },

        createTransaction: function () {
            createTransactionCalled = true;
        },

        propagateTransaction: function () {
            propagateTransactionCalled = true;
        }
    };

    var $controller;
    var $rootScope;

    beforeEach(inject(function(_$controller_, _$rootScope_){

        $controller = _$controller_;
        $rootScope = _$rootScope_;

        $rootScope.$watch = function(){};
    }));

    describe("addToTransaction()", function(){
        var $scope, controller;


        beforeEach(function() {
            $scope = $rootScope;
            controller = $controller('WalletDemoController', { $scope: $scope, bitcoinNetwork: bitcoinNetwork});

            $scope.amount = 3;
            $scope.fee = 1;
        });

        it('is transaction invalid at initialization', function() {
            expect($scope.isTransactionValid).toEqual(false);
        });

        it('utxo added to list', function() {
            $scope.addToTransaction({amount: 5});
            expect($scope.currentTransactionUtxos.length).toEqual(1);
        });

        it('multiple utxos added list', function() {
            $scope.addToTransaction({amount: 5});
            $scope.addToTransaction({amount: 5});

            expect($scope.currentTransactionUtxos.length).toEqual(2);
        });

        it('increases amount', function() {
            $scope.addToTransaction({amount: 5});
            expect($scope.currentTransactionAmount).toEqual(5);
        });

        it('is transaction valid after enough amount is added', function() {
            $scope.addToTransaction({amount: 5});
            expect($scope.isTransactionValid).toEqual(true);
        });

        it('is transaction valid when amount just enough', function() {
            $scope.addToTransaction({amount: 4});
            expect($scope.isTransactionValid).toEqual(true);
        });

        it('is transaction invalid when amount is not reached', function() {
            $scope.addToTransaction({amount: 3});
            expect($scope.isTransactionValid).toEqual(false);
        });
    });

    describe("removeFromTransaction()", function(){
        var $scope, controller;
        var utxo1 = {amount: 5, $$hashKey:1};
        var utxo2 = {amount: 4, $$hashKey:1};

        beforeEach(function() {
            $scope = $rootScope;
            controller = $controller('WalletDemoController', { $scope: $scope, bitcoinNetwork: bitcoinNetwork});

            $scope.amount = 3;
            $scope.fee = 1;

            $scope.currentTransactionUtxos = [utxo1,utxo2];
            $scope.currentTransactionAmount = 9;
            $scope.isTransactionValid = true;
        });


        it('utxo removed from list', function() {
            $scope.removeFromTransaction(utxo1);
            $scope.removeFromTransaction(utxo2);
            expect($scope.currentTransactionUtxos.length).toEqual(0);
        });

        it('utxo removed only the provided utxo', function() {
            $scope.removeFromTransaction(utxo1);
            expect($scope.currentTransactionUtxos.length).toEqual(1);
            expect($scope.currentTransactionUtxos[0]).toEqual(utxo2);
        });

        it('decreases amount', function() {
            $scope.removeFromTransaction(utxo1);
            $scope.removeFromTransaction(utxo2);
            expect($scope.currentTransactionAmount).toEqual(0);
        });

        it('is transaction invalided after remove', function() {
            $scope.removeFromTransaction(utxo1);
            $scope.removeFromTransaction(utxo2);
            expect($scope.isTransactionValid).toEqual(false);
        });

        it('is transaction still valided when enough utxo are spent', function() {
            $scope.removeFromTransaction(utxo1);
            expect($scope.isTransactionValid).toEqual(true);
        });
    });

    describe("filterAlreadyAddedToTransaction()", function(){
        var $scope, controller;
        var utxo1 = {amount: 5, $$hashKey:1};
        var utxo2 = {amount: 5, $$hashKey:2};


        beforeEach(function() {
            $scope = $rootScope;
            controller = $controller('WalletDemoController', { $scope: $scope, bitcoinNetwork: bitcoinNetwork});

            $scope.currentTransactionUtxos = [utxo1];
        });


        it('return false for present utxo', function() {
            var doFilter = $scope.filterAlreadyAddedToTransaction(utxo1);
            expect(doFilter).toEqual(false);
        });

        it('return true for present utxo', function() {
            var doFilter = $scope.filterAlreadyAddedToTransaction(utxo2);
            expect(doFilter).toEqual(true);
        });
    });

    describe("sendTransaction()", function(){
        var $scope, controller;

        beforeEach(function() {
            $scope = $rootScope;
            controller = $controller('WalletDemoController', { $scope: $scope, bitcoinNetwork: bitcoinNetwork});

            createTransactionCalled = false;
            propagateTransactionCalled = false;

        });

        it('transaction created', function() {
            $scope.sendTransaction();
            expect(createTransactionCalled).toBeTruthy();
        });

        it('transaction sent into bitcoin network', function() {
            $scope.sendTransaction();
            expect(propagateTransactionCalled).toBeTruthy();
        });
    });

    describe('sum utxos filter', function() {
        var wallet = {utxos:[{amount: 5},{amount: 5}]};
        var $filter;

        beforeEach(inject(function(_$filter_){
            $filter = _$filter_;
        }));

        it('utxos amounts are summed', function() {
            var sumUtxo = $filter('sumUtxos');
            expect(sumUtxo(wallet)).toEqual(10);
        });

        it('return 0 if utxos list is empty', function() {
            var sumUtxo = $filter('sumUtxos');
            expect(sumUtxo({utxos:[]})).toEqual(0);
        });

        it('return 0 if wallet is not passed', function() {
            var sumUtxo = $filter('sumUtxos');
            expect(sumUtxo()).toEqual(0);
        });
    });

});