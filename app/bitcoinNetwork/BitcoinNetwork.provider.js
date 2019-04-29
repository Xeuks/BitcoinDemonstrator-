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

        this.createBitcoinNetwork = function(wallets, miners) {
            var gensisTransactions = [];
            //TODO miners
            wallets.forEach(function(wallet) {
                wallet.utxos.forEach(function (utxo) {
                    gensisTransactions.push({from: 0, to: wallet.address, amount: utxo.amount});
                });
            });

            var genesisBlock = new Block(0, gensisTransactions, 0 , "gensisBlock");
            genesisBlock.calculateNextHash();

            bcNetwork = new BitcoinNetwork(genesisBlock, wallets, miners);
        };

        this.$get = function() {

            return bcNetwork;
        };
    });


function BitcoinNetwork(genesisBlock, wallets, miners) {
    this.blockchain = [].push(genesisBlock);

    this.wallets = wallets;

    this.miners = miners;

    this.difficulty = 1;


    this.listeners = [];

    this.getMiners = function() {
        return [].concat(this.miners);
    };

    this.getWallets = function() {
        return [].concat(this.wallets);
    };

    this.addListener = function (listener) {
        this.push(listener);
    };

    this.removeListener = function (listener) {
        var idx = this.listeners.indexOf(listener);
        this.listeners.splice(idx, 1);
    };

    this.propagateBlock = function (block) {
        var subscribers = this.listeners
            .concat(this.miners)
            .concat(this.wallets);

        subscribers.forEach(function (node) {
            if (typeof node.onNewBlock === 'function')
                node.onNewBlock(block);
        });

        this.blockchain.push(block);
    };

    this.propagateTransaction = function (transaction) {
        var subscribers = this.listeners
            .concat(this.miners)
            .concat(this.wallets);

        subscribers.forEach(function (node) {
            if (typeof(node.onNewTransaction) === 'function')
                node.onNewTransaction(transaction);
        });
    };

    this.createTransaction = function(fromWallet, toWallet, amount, fee, utxos) {
        return new Transaction(fromWallet, toWallet, amount, fee, utxos);
    };

    this.createBlock = function (miner, transactions, parentHash) {
        return new Block(miner, transactions, this.difficulty ,parentHash);
    };
}

function Block(minedBy, transactions, difficulty) {
    this.minedBy = minedBy;
    this.transactions = transactions;
    this.difficulty = difficulty;
    this.nonce = 0;
    this.hash = "";

    this.calculateNextHash = function() {
        this.nonce++;
        this.hash =  sha256(this.toString());

        return this.hash;
    };

    this.isValid = function() {
        return this.hash.startsWith(difficulty);
    }

    this.toString = function() {
        var stringRepresentation =
            String(this.minedBy) + String(this.nonce);

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

    this.candidateBlock = null;

    this.onNewTransaction = function (transaction) {
        this.mempool.push(transaction);
    };

    this.createCandidateBlock = function(difficulty) {
        var reward = 10;
        this.mempool.forEach(function (transaction) {
            reward += transaction.fee;
        });

        var coinbaseTx = new Transaction(0, this.address, reward, 0, [{amount: reward}]);
        var transactions = [coinbaseTx].concat( this.mempool);


        this.candidateBlock = new Block(this.address, transactions, difficulty);
    };
}

function Transaction(fromWallet, toWallet, amount, fee, utxos) {
    this.from = fromWallet.address;
    this.to = toWallet.address;
    this.amount = amount;
    this.fee = fee;
    this.change = 0;

    var curTxAmount = 0;

    if(typeof(utxos) === 'undefined')
    {
        var utxosList = [];

        for(var idx = 0; curTxAmount < amount && idx < fromWallet.utxos.length; idx++)
        {
            curTxAmount += fromWallet.utxos[idx].amount;
            utxosList.push(fromWallet.utxos[idx]);
        }


        if(curTxAmount < amount)
        {
            throw new Error('Transaction could not be build because wallet has not enough bitcoins!');
        }
        else
        {
            this.utxos = utxosList;
        }
    }
    else
    {
        utxos.forEach(function(utxo){ curTxAmount += utxo.amount; });
        this.utxos = utxos;
    }

    var change = curTxAmount - amount - fee;

    if(change > 0)
    {
        this.change = change;
    }

    this.toString = function() {
        return String(this.from) + String(this.to) + String(this.amount) + String(this.fee);
    };
}