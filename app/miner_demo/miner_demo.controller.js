'use strict';

angular
    .module('myApp')
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/miner_demo', {
            templateUrl: 'miner_demo/view.html',
            controller: 'MinerDemoController'
        });
    }])
    .controller('MinerDemoController', ['$scope', '$interval', 'bitcoinNetwork', function($scope, $interval ,bitcoinNetwork) {
        var miningInterval;

        $scope.hashText = "Beispiel Text";

        $scope.miners =  bitcoinNetwork.getMiners();

        $scope.wallets =  [].concat(bitcoinNetwork.getWallets()).concat(bitcoinNetwork.getMiners());
        $scope.currentMiner = $scope.miners[0];
        $scope.currentWallet = $scope.wallets[0];

        $scope.validBlockFound = false;
        $scope.forkOccured = false;
        $scope.forkResolved = false;

        $scope.removeFromMempool = function (index) {
            $scope.currentMiner.mempool.splice(index, 1);
        };

        $scope.getRandomValueBetween = function(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };

        $scope.checkIfTransactionsArePresent = function() {
            return $scope.miners.every(function (miner) {
                return miner.mempool.length > 0;
            });
        };

        $scope.getUnUsedUTXOsinMinerMempool = function(wallet, miner){
            var unUsedUTXOs = [].concat(wallet.utxos);

            miner.mempool.forEach(function(mempoolTransaction){

                if(mempoolTransaction.from === wallet.address)
                {
                    wallet.utxos.forEach(function(utxo, idx){
                        if(mempoolTransaction.utxos.indexOf(utxo) !== -1)
                        {
                            unUsedUTXOs.splice(idx,1);
                        }

                    });
                }
            });


            return unUsedUTXOs;
        };

        $scope.generateTransaction = function(miner) {
            $scope.wallets.forEach(function(wallet, index) {
                var toIdx = $scope.getRandomValueBetween(0, $scope.wallets.length-1);

                toIdx = (toIdx === index) ? ((toIdx + 1) % $scope.wallets.length) : toIdx;

                var unUsedUTXOs = $scope.getUnUsedUTXOsinMinerMempool(wallet, miner);

                if(unUsedUTXOs.length > 0)
                {
                    var transaction = bitcoinNetwork.createTransaction(
                        wallet,
                        $scope.wallets[toIdx],
                        unUsedUTXOs[0].amount-0.5,
                        0.5
                    );

                    miner.mempool.push(transaction);
                }
            });
        };

        $scope.getCoinbaseReward = function(mempool) {
            var reward = 10;

            mempool.forEach(function(mempoolTransaction){

                reward += mempoolTransaction.fee;
            });

            return reward;
        };

        $scope.getHash = function(value) {
            return sha256(value);
        };

        $scope.startToMineBlock = function(){
            if ( $scope.isMiningInProgress() ) return;

            $scope.validBlockFound = false;
            $scope.currentMiner.createCandidateBlock("00");

            miningInterval = $interval(function(){
                $scope.currentMiner.candidateBlock.calculateNextHash();
                $scope.validBlockFound = $scope.currentMiner.candidateBlock.isValid();
                if($scope.validBlockFound === true) {
                    $scope.stopToMineBlock();
                }
            }, 50);
        };

        $scope.stopToMineBlock = function() {
            if ($scope.isMiningInProgress()) {
                $interval.cancel(miningInterval);
                miningInterval = undefined;
            }
        };


        $scope.generateTransactionForAllMiners = function(){
            $scope.miners.forEach(function(miner){
                $scope.generateTransaction(miner);
            });
        };

        $scope.isMiningInProgress = function(){
            return angular.isDefined(miningInterval);
        };

        $scope.startToMiningCompetition = function(numRequiredValidBlocks) {
            if ( $scope.isMiningInProgress() ) return;

            $scope.miningCompetitionFinished = false;
            $scope.candidateBlocks = [];
            $scope.miners.forEach(function(miner){
                miner.createCandidateBlock("00");
                $scope.candidateBlocks[miner.address] = {block: miner.candidateBlock, hash:0, isValid: false};
            });
            $scope.dummyNonce = 0;

            miningInterval = $interval(function(){
                var numValidBlocks = 0;
                $scope.dummyNonce++;
                $scope.candidateBlocks.forEach(function(candidateBlock){

                    if(!candidateBlock.block.isValid()) {
                        candidateBlock.hash = candidateBlock.block.calculateNextHash();
                    }
                    else
                    {
                        numValidBlocks++;
                        candidateBlock.hash = $scope.getHash
                        ("dummmy"+ String(candidateBlock.block.minedBy) + String($scope.dummyNonce));
                    }

                });

                if(numValidBlocks >= numRequiredValidBlocks) {
                    $scope.miningCompetitionFinished = true;
                    $scope.stopToMineBlock();

                    if($scope.forkOccured) {
                        $scope.forkResolved = true;
                    }

                    $scope.forkOccured = numRequiredValidBlocks > 1;
                    $scope.candidateBlocks.forEach(function(candidateBlock){
                        candidateBlock.hash = candidateBlock.block.hash;
                        candidateBlock.isValid = candidateBlock.block.isValid();

                        if(candidateBlock.isValid) {
                            bitcoinNetwork.onNewBlockMined(candidateBlock.block);
                        }
                    });

                    $scope.miners.forEach(function(miner) {
                        miner.mempool = [];
                    });
                }
            }, 10);
        };



        $scope.$on('$destroy', function() {
            $scope.stopToMineBlock();
        });

    }]);
