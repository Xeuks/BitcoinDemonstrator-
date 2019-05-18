'use strict'
angular
    .module('myApp').provider("bitcoinNetwork", function() {
        var bcNetwork;
        var curAddress = 1;

        this.createMiner = function(utxos) {
            return  new Miner(curAddress++, utxos);
        };

        this.createWallet = function(utxos) {
            return new Wallet(curAddress++, utxos);
        };

        this.createGenesisTransaction = function(node) {
            var amount = 0;
            node.utxos.forEach(function (utxo) {
                amount += utxo.amount;
            });
            return {from: 0, to: node.address, amount: amount, utxos : node.utxos, fee: 0, change:0};
        };

        this.createBitcoinNetwork = function(wallets, miners) {
            var gensisTransactions = [];

            var nodes = [].concat(wallets).concat(miners);
            nodes.forEach(function(node) {
                var amount = 0;
                node.utxos.forEach(function (utxo) {
                    amount += utxo.amount;
                });
                var tx =  {from: 0, to: node.address, amount: amount, utxos : node.utxos, fee: 0, change:0};
                gensisTransactions.push(tx);
            });

            var genesisBlock = new Block(0, gensisTransactions, 0 , "");
            genesisBlock.calculateNextHash();
            genesisBlock.height = 0;



            bcNetwork = new BitcoinNetwork(genesisBlock, wallets, miners);

        };

        this.$get = function() {

            return bcNetwork;
        };
    });


function BitcoinNetwork(genesisBlock, wallets, miners) {
    this.blockchain = [[genesisBlock]];

    this.wallets = wallets;

    this.miners = miners;

    this.difficulty = 1;


    this.listeners = [];

    this.getMiners = function() {
        return this.miners;
    };

    this.getWallets = function() {
        return [].concat(this.wallets);
    };

    this.getNodes = function() {
        return [].concat(this.wallets).concat(this.miners);
    };

    this.getBlockchain = function() {
        return this.blockchain;
    };

    this.getGenesisBlock = function() {
        return this.blockchain[0][0];
    }

    this.addListener = function (listener) {
        this.listeners.push(listener);
    };

    this.removeListener = function (listener) {
        var idx = this.listeners.indexOf(listener);
        this.listeners.splice(idx, 1);
    };

    this.addBlockToBlockchain = function(block) {
        var currentHeadIdx = this.blockchain.length - 1;

        var isParentInHead = this.blockchain[currentHeadIdx].some(function(headBlock) {
           return headBlock.hash === block.parentBlockHash;
        });


        if(isParentInHead) {
            this.blockchain.push([block]);
        } else {
            //parent is in prev
            this.blockchain[currentHeadIdx].push(block);
        }
    };

    this.onNewBlockMined = function(block) {
        this.propagateBlock(block);
        this.addBlockToBlockchain(block);
    };

    this.propagateBlock = function (block) {
        var subscribers = this.listeners
            .concat(this.miners);

        subscribers.forEach(function (node) {
            if (typeof node.onNewBlock === 'function')
                node.onNewBlock(block);
        });
    };

    this.propagateTransaction = function (transaction) {
        var subscribers = this.listeners
            .concat(this.miners);

        subscribers.forEach(function (node) {
            if (typeof(node.onNewTransaction) === 'function')
                node.onNewTransaction(transaction);
        });
    };

    this.createTransaction = function(fromWallet, toWallet, amount, fee, utxos) {
        var utxosList = [];

        var curTxAmount = 0;

        if(typeof(utxos) === 'undefined')
        {

            for(var idx = 0; curTxAmount < amount && idx < fromWallet.utxos.length; idx++)
            {
                curTxAmount += fromWallet.utxos[idx].amount;
                utxosList.push(fromWallet.utxos[idx]);
            }


            if(curTxAmount < amount)
            {
                throw new Error('Transaction could not be build because wallet has not enough bitcoins!');
            }
        }

        return new Transaction(fromWallet.address, toWallet.address, amount, fee, utxosList);
    };

    this.createBlock = function(minedBy, transactions, difficulty, parentBlockHash) {
        return new Block(minedBy, transactions, difficulty, parentBlockHash);
    };
}

function Block(minedBy, transactions, difficulty, parentBlockHash) {
    this.minedBy = minedBy;
    this.transactions = transactions;
    this.difficulty = difficulty;
    this.nonce = 0;
    this.hash = "";
    this.parentBlockHash = parentBlockHash;
    this.isDummy = false;

    this.calculateNextHash = function() {
        this.nonce++;
        this.hash =  sha256(this.toString());

        return this.hash;
    };

    this.isValid = function() {
        return this.hash.startsWith(difficulty);
    };

    this.toString = function() {
        var stringRepresentation =
            String(this.minedBy) + String(this.nonce) + String(this.parentBlockHash);

        this.transactions.forEach(function (transaction) {
            stringRepresentation = stringRepresentation + transaction.toString();
        });

        return stringRepresentation;
    };
}

function Wallet(address, utxos) {
    this.address = address;
    this.utxos = utxos;
}

function Miner(address, utxos) {
    this.address = address;
    this.utxos = utxos;
    this.mempool = [];
    this.parentHash = "";

    this.candidateBlock = null;

    this.onNewTransaction = function (transaction) {
        this.mempool.push(transaction);
    };

    this.onNewBlock = function (block) {
        if (!block.isDummy) {
            if (!this.candidateBlock.isValid()) {
                this.parentHash = block.hash;
            } else {
                this.parentHash = this.candidateBlock.hash;
            }

            this.mempool = [];
        }
    };

    this.createCandidateBlock = function(difficulty) {
        var reward = 10;
        this.mempool.forEach(function (transaction) {
            reward += transaction.fee;
        });

        var coinbaseTx = new Transaction(0, this.address, reward, 0, [{amount: reward}]);
        var transactions = [coinbaseTx].concat(this.mempool);


        this.candidateBlock = new Block(this.address, transactions, difficulty, this.parentHash);
    };
}

function Transaction(fromWallet, toWallet, amount, fee, utxos) {
    this.from = fromWallet;
    this.to = toWallet;
    this.amount = amount;
    this.fee = fee;
    this.change = 0;

    var curTxAmount = 0;

    utxos.forEach(function(utxo){
        curTxAmount += utxo.amount;
    });
    this.utxos = utxos;

    var change = curTxAmount - amount - fee;

    if(change > 0)
    {
        this.change = change;
    }

    this.toString = function() {
        return String(this.from) + String(this.to) + String(this.amount) + String(this.fee);
    };
}