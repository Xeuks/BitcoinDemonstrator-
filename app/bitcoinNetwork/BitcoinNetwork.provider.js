'use strict';

angular
    .module('myApp').provider("bitcoinNetwork", function() {
    var bcNetwork;

    this.createWallet = function(address, utxos) { return new Wallet(address, utxos); };

    this.createBitcoinNetwork = function(genesisBlock, wallets, miners) {
        bcNetwork = new BitcoinNetwork(genesisBlock, wallets, miners);
    };

    this.$get = function() {

        return bcNetwork;
    };
});


function BitcoinNetwork(genesisBlock, wallets, miners) {
    this.blockchain = genesisBlock;

    this.wallets = wallets;

    this.miners = miners;

    this.difficulty = 0;


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
        this.listeners.forEach(function (node) {
            if (typeof node.onNewBlock === 'function')
                node.onNewBlock(block);
        });
    };

    this.propagateTransaction = function (transaction) {
        this.listeners.forEach(function (node) {
            if (typeof node.onNewTransaction === 'function')
                node.onNewTransaction(transaction);
        });
    };

}

function Block() {
    //miner:1,
    //transactions:[{},{},...]
    //hash
    //difficulty
    //parentBlock:null,
    //siblings:[]
}

function Wallet(address, utxos) {
    this.address = address;
    this.utxos = utxos;

    this.onNewTransaction = function (transaction) {
    };
}

function Miner() {
    //address
    //utxo
    //mempool

    this.onNewTransaction = function (transaction) {
    };
    this.onNewBlock = function (block) {
    };

    //mine
}

function Transaction() {
    this.from = 0;
    this.to = 0;
    this.amount = 0;
}


//zerst hash mit einem 0 wenn miner hinzugefügt
//