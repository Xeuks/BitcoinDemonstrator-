'use strict';

angular
    .module('myApp').provider("bitcoinNetwork", function() {
    var wallets = [];
    var genesisBlock = {};
    this.initializeBlockchain = function() {
        wallets.push({
            address:1,
            utxos:[
                {amount: 20},
                {amount: 15},
                {amount: 5}
            ]
        });

        wallets.push({
            address:2,
            utxos:[
                {amount: 10}
            ]
        });

        genesisBlock = {
            transactions: [
                { from: 0, to: 1, Amount: 20},{ from: 0, to: 1, Amount: 15},{ from: 0, to: 1, Amount: 5},
                { from: 0, to: 2, Amount: 10}
            ],
            PoWAnswer:0,
            PoWChallange:0,
            parentBlock:0,
            siblings:[]
        };

    };

    this.$get = function() {

        return {
            headOfBlockchain: genesisBlock,

            getWallets: function() {
                return [].concat(wallets);
            },


            addBlock: function(block){
                var parentBlock = headOfBlockchain;
                headOfBlockchain.block;
                block.parentBlock = parentBlock;
            },

            sendTransaction: function(transaction){
                //send to miners

                //send to wallets

                addBlock({
                    transactions: transaction.to,
                    PoWAnswer:0,
                    PoWChallange:0,
                    parentBlock:null,
                    siblings:[]
                });
            },


        };
    };
});