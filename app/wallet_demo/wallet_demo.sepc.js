'use strict';

describe("test wallet demo controller", function(){

    beforeEach(module("myApp"));
    var transaction = {};

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

        propagateTransaction: function(tx) {
            transaction = tx;
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
        var utxo = {amount: 5, $$hashKey:1};


        beforeEach(function() {
            $scope = $rootScope;
            controller = $controller('WalletDemoController', { $scope: $scope, bitcoinNetwork: bitcoinNetwork});

            $scope.amount = 3;
            $scope.fee = 1;

            $scope.currentTransactionUtxos = [utxo];
            $scope.currentTransactionAmount = 5;
            $scope.isTransactionValid = true;
        });


        it('utxo removed from list', function() {
            $scope.removeFromTransaction(utxo);
            expect($scope.currentTransactionUtxos.length).toEqual(0);
        });

        it('decreases amount', function() {
            $scope.removeFromTransaction(utxo);
            expect($scope.currentTransactionAmount).toEqual(0);
        });

        it('is transaction invalided after remove', function() {
            $scope.removeFromTransaction(utxo);
            expect($scope.isTransactionValid).toEqual(false);
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
        var utxo1 = {amount: 5};


        beforeEach(function() {
            $scope = $rootScope;
            controller = $controller('WalletDemoController', { $scope: $scope, bitcoinNetwork: bitcoinNetwork});



            $scope.amount =3;
            $scope.fee =1;
            $scope.currentTransactionAmount = 5;
            $scope.currentTransactionUtxos = [utxo1];
        });


        it('transaction sent into bitcoin network', function() {
            $scope.sendTransaction();
            expect(transaction.from).toEqual($scope.currentWallet.address);
        });

        it('transaction to receive address added', function() {
            $scope.sendTransaction();
            expect(transaction.to[0].address).toEqual($scope.toWallet.address);
        });

        it('change transaction added if more then amount is added', function() {
            $scope.sendTransaction();
            expect(transaction.to[1].address).toEqual($scope.currentWallet.address);
            expect(transaction.to[1].amount).toEqual(1);

        });

        it('change transaction not if amount is just enough', function() {
            $scope.amount =4;
            $scope.fee =1;

            $scope.sendTransaction();
            expect(transaction.to.length).toEqual(1);
        });

        it('enough fee is paid in transaction', function() {
            $scope.amount =4;
            $scope.fee =1;

            $scope.sendTransaction();
            expect($scope.currentTransactionAmount -  transaction.to[0].amount).toEqual(1);
        });
    });

    describe('sum utxos filter', function() {
        var utxos = [{amount: 5},{amount: 5}]
        var $filter;

        beforeEach(inject(function(_$filter_){
            $filter = _$filter_;
        }));

        it('utxos amounts are summed', function() {
            var sumUtxo = $filter('sumUtxos');
            expect(sumUtxo(utxos)).toEqual(10);
        });

        it('return 0 if utxos list is empty', function() {
            var sumUtxo = $filter('sumUtxos');
            expect(sumUtxo([])).toEqual(0);
        });
    });

});