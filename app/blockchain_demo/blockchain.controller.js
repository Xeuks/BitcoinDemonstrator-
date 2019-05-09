'use strict';

angular.module('myApp')
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/blockchain_demo', {
            templateUrl: 'blockchain_demo/view.html',
            controller: 'BlockchainController'
        });
    }])
    .controller('BlockchainController', ['$scope', 'bitcoinNetwork', function($scope, bitcoinNetwork) {
        $scope.blockchain = bitcoinNetwork.getBlockchain();
        $scope.currentBlock = $scope.blockchain[0];
        $scope.walletStates = [];
        $scope.nodes = bitcoinNetwork.getNodes();


        $scope.getBlockHeight = function(block) {
            return $scope.blockchain.indexOf(block);
        };

        $scope.getBlockReward = function(block) {
            var reward = ($scope.isGensisBlock(block)) ? 0 : 10;
            block.transactions.forEach(function(transaction) {
                reward += transaction.fee;
            });


            return reward;
        };

        $scope.getPreviousBlockHash = function(block) {
            var blockIdx = $scope.getBlockHeight(block);
            var prevHash = "Gensis Block hat keine Vorgänger";

            if(blockIdx > 0) {
                prevHash = $scope.blockchain[blockIdx-1].hash;
            }

            return prevHash;
        };

        $scope.isGensisBlock = function(block) {
            var blockIdx = $scope.getBlockHeight(block);
            return blockIdx === 0;
        };

        $scope.setWalletsState = function(block) {
            var blockIdx = this.blockchain.indexOf(block);
            $scope.walletStates = [];
            if (blockIdx >= 0) {

                $scope.nodes.forEach(function (node) {
                    $scope.walletStates[node.address-1] = {address: node.address, balance: 0, utxos: [], receivedUtxos: [], spentUtxos: []};
                });

                for (var i = 0; i <= blockIdx; i++) {
                    this.blockchain[i].transactions.forEach(function (transaction) {
                        var toWalletAddress = transaction.to-1;
                        var fromWalletAddress = transaction.from;




                        if(fromWalletAddress > 0) {
                            transaction.utxos.forEach(function (transactionUtxo) {
                                $scope.walletStates[fromWalletAddress-1].balance -= transactionUtxo.amount;
                                var idx = $scope.walletStates[fromWalletAddress-1].utxos.findIndex(function(curUtxo) {
                                    return transactionUtxo.amount === curUtxo;
                                });

                                if(idx !== -1){
                                    $scope.walletStates[fromWalletAddress-1].utxos.splice(idx, 1);
                                }
                            });

                            $scope.walletStates[fromWalletAddress-1].balance += transaction.change;

                            if(transaction.change > 0)
                                $scope.walletStates[fromWalletAddress-1].utxos.push(transaction.change);
                        }

                        $scope.walletStates[toWalletAddress].balance += transaction.amount;
                        $scope.walletStates[toWalletAddress].utxos.push(transaction.amount);

                    });
                }

                if(blockIdx === 0) {
                    this.blockchain[blockIdx].transactions.forEach(function (transaction) {
                        var toWalletAddress = transaction.to-1;
                        transaction.utxos.forEach(function(utxo) {
                            $scope.walletStates[toWalletAddress].receivedUtxos.push(utxo.amount);
                        });
                    });
                } else {
                    this.blockchain[blockIdx].transactions.forEach(function (transaction) {
                        var toWalletAddress = transaction.to-1;
                        var fromWalletAddress = transaction.from;

                        if(fromWalletAddress > 0) {
                            $scope.walletStates[fromWalletAddress-1].spentUtxos = $scope.walletStates[fromWalletAddress-1].spentUtxos.concat(transaction.utxos);
                            if(transaction.change > 0)
                                $scope.walletStates[fromWalletAddress-1].receivedUtxos.push(transaction.change);
                        }

                        $scope.walletStates[toWalletAddress].receivedUtxos.push(transaction.amount);
                    });
                }




            }
        };

        $scope.setWalletsState($scope.currentBlock);
    }]);