'use strict';
angular
    .module('myApp')
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/wallet_demo', {
            templateUrl: 'wallet_demo/view.html',
            controller: 'WalletDemoController'
        });
    }])

    .filter('sumUtxos', function() {
        return function(wallet) {
            if (typeof(wallet) === 'undefined' || typeof(wallet.utxos) === 'undefined' || wallet.utxos.length === 0) {
                return 0;
            }

            var sum = wallet.utxos.reduce(function(total, utxo) { return {amount: total.amount+utxo.amount};});

            return sum.amount;
        };
    })
    .controller('WalletDemoController', ['$scope', 'bitcoinNetwork', function($scope, bitcoinNetwork) {

        $scope.wallets =  [].concat(bitcoinNetwork.getWallets()).concat(bitcoinNetwork.getMiners());

        $scope.currentWallet = $scope.wallets[0];
        $scope.toWallet = $scope.wallets[1];
        $scope.currentTransactionUtxos = [];
        $scope.fee = 0.5;
        $scope.amount = 1;
        $scope.currentTransactionAmount = 0;
        $scope.isTransactionValid = false;
        $scope.wasTransactionSent = false;

        // reset transaction data when current wallet is changed
        $scope.$watch('currentWallet', function (newValue, oldValue, scope) {
            $scope.currentTransactionUtxos = [];
            $scope.isTransactionValid = false;

            if(oldValue !== newValue)
                $scope.toWallet = oldValue;

        });

        $scope.addToTransaction = function(utxo) {
            $scope.currentTransactionAmount += utxo.amount;

            $scope.validateTransaction();

            $scope.currentTransactionUtxos.push(utxo);

            $scope.wasTransactionSent = false;
        };

        $scope.removeFromTransaction = function(utxo) {
            $scope.currentTransactionAmount -= utxo.amount;

            $scope.validateTransaction();

            var idx = $scope.currentTransactionUtxos.indexOf(utxo);
            $scope.currentTransactionUtxos.splice(idx, 1);

            $scope.wasTransactionSent = false;
        };

        $scope.filterAlreadyAddedToTransaction = function(utxo) {
            return $scope.currentTransactionUtxos.indexOf(utxo) === -1;
        };

        $scope.validateTransaction = function() {
            $scope.isTransactionValid = $scope.currentTransactionAmount >= ($scope.amount+$scope.fee);
        };

        $scope.sendTransaction = function() {

            var transaction = bitcoinNetwork.createTransaction(
                $scope.currentWallet, $scope.toWallet, $scope.amount,
                $scope.fee, $scope.currentTransactionUtxos
            );

            $scope.wasTransactionSent = true;
            bitcoinNetwork.propagateTransaction(transaction);
        };
    }]);