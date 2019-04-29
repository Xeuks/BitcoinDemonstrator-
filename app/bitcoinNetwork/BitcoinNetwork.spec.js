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

    describe("wallet", function(){


        it('is defined as a class', function() {
            var miner = bcNetworkProvider.createMiner([]);
            expect(typeof(miner)).toEqual("object");
        });
    });

    describe("bitcoin network", function(){


        it('is defined as a class', function() {

            expect(typeof(bcNetwork)).toEqual("object");
        });
    });
});