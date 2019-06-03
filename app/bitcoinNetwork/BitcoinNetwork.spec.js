'use strict';

describe("test bitcoin network", function(){

    var bcNetworkProvider;
    var bcNetwork;

    beforeEach(module("myApp"));

    beforeEach(function() {
        module(function(bitcoinNetworkProvider) {
            bcNetworkProvider = bitcoinNetworkProvider;
            bitcoinNetworkProvider.createBitcoinNetwork([],[]);
        });

        inject(function(_bitcoinNetwork_) {
           bcNetwork = _bitcoinNetwork_;
        });
    });


    describe("miner", function(){


        it('is defined as a class', function() {
            var miner = bcNetworkProvider.createMiner("test", []);
            expect(typeof(miner)).toEqual("object");
        });
    });

    describe("bitcoin network", function(){


        it('is defined as a class', function() {

            expect(typeof(bcNetwork)).toEqual("object");
        });

        it('miner and wallet address wont collide', function() {
            var miner = bcNetworkProvider.createMiner("miner", []);
            var wallet = bcNetworkProvider.createWallet("wallet", []);
            var miner2 = bcNetworkProvider.createMiner("miner2", []);
            expect(wallet.address).toEqual(2);
            expect(miner2.address).toEqual(3);
        });


    });


    describe("on block is added", function(){


        it('listeneres are notified', function() {
            var wasNotified = false;
            bcNetwork.addListener({onNewBlock: function (block) {
                    wasNotified = true;
                }});
            bcNetwork.onNewBlockMined({hash:"1", parentBlockHash:bcNetwork.getGenesisBlock().hash});

            expect(wasNotified).toEqual(true);
        });

        it('listeneres get correct block', function() {
            var isCorrectBlock = false;
            bcNetwork.addListener({onNewBlock: function (block) {
                    isCorrectBlock = block.hash==="1";
                }});
            bcNetwork.onNewBlockMined({hash:"1", parentBlockHash:bcNetwork.getGenesisBlock().hash});

            expect(isCorrectBlock).toEqual(true);
        });


        it('block is added to blockchain', function() {
            bcNetwork.onNewBlockMined({hash:"1", parentBlockHash:bcNetwork.getGenesisBlock().hash});
            expect(bcNetwork.blockchain.length).toEqual(2);
        });

        it('when its a fork block it will incl', function() {
            bcNetwork.onNewBlockMined({hash:2, parentBlockHash:bcNetwork.getGenesisBlock().hash});
            bcNetwork.onNewBlockMined({hash:2, parentBlockHash:bcNetwork.getGenesisBlock().hash});
            expect(bcNetwork.blockchain[1].length).toEqual(2);
        });


    });

});