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

        this.createSampleBlockchain = function(genesisBlock) {

            var sampelTxBlock1 = [];
            sampelTxBlock1.push(
                {from: 0, to: 3, amount: 11, utxos : [{amount: 11}], fee: 0, change:0},
                {from: 1, to: 2, amount: 5, utxos : [{amount: 20}], fee: 1, change:14});
            var block1 = new Block(3, sampelTxBlock1, "00", genesisBlock.hash);
            block1.nonce = 230;
            block1.hash = "004ea51d48bc0a191a1b8ac47d14fc08099f2003b55cf55aacb6d55d362d1e4b";

            var sampleTxBlock2 = [];
            sampleTxBlock2.push(
                {from: 0, to: 5, amount: 17, utxos : [{amount: 17}], fee: 0, change:0},
                {from: 2, to: 4, amount: 3, utxos : [{amount: 4}], fee: 0.5, change:0.5},
                {from: 3, to: 1, amount: 10, utxos : [{amount: 50}], fee: 4, change:36},
                {from: 4, to: 2, amount: 5.5, utxos : [{amount: 20}], fee: 2.5, change:12});
            var block2 = new Block(5, sampleTxBlock2, "00", block1.hash);
            block2.nonce = 2;
            block2.hash = "0083d30c81f5948f8734a5a2d03861b2eea304c35356bcb790d7a7e18525bdd2";

            return [genesisBlock, block1, block2];
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

            var blockchain = this.createSampleBlockchain(genesisBlock);


            bcNetwork = new BitcoinNetwork(blockchain, wallets, miners);

        };

        this.$get = function() {

            return bcNetwork;
        };
    });


function BitcoinNetwork(blockchain, wallets, miners) {
    this.blockchain = blockchain;

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
        return [].concat(this.blockchain);
    };

    this.addListener = function (listener) {
        this.listeners.push(listener);
    };

    this.removeListener = function (listener) {
        var idx = this.listeners.indexOf(listener);
        this.listeners.splice(idx, 1);
    };

    this.addBlockToBlockchain = function(block) {
        this.propagateBlock(block);

        var parentHash = this.blockchain[this.blockchain.length-1].hash;
       // if(parentHash.)

        this.blockchain.push(block);
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
}

function Block(minedBy, transactions, difficulty, parentBlockHash) {
    this.minedBy = minedBy;
    this.transactions = transactions;
    this.difficulty = difficulty;
    this.nonce = 0;
    this.hash = "";
    this.parentBlockHash = parentBlockHash;

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
    this.blockchainHead = "";

    this.candidateBlock = null;

    this.onNewTransaction = function (transaction) {
        this.mempool.push(transaction);
    };

    this.onNewBlock = function (block) {
        if(!this.candidateBlock.isValid()) {
            this.blockchainHead = block.hash;
        } else {
            this.blockchainHead = this.candidateBlock.hash;
        }

        this.mempool = [];
    };

    this.createCandidateBlock = function(difficulty) {
        var reward = 10;
        this.mempool.forEach(function (transaction) {
            reward += transaction.fee;
        });

        var coinbaseTx = new Transaction(0, this.address, reward, 0, [{amount: reward}]);
        var transactions = [coinbaseTx].concat(this.mempool);


        this.candidateBlock = new Block(this.address, transactions, difficulty, this.blockchainHead);
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