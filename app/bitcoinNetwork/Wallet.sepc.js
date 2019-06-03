'use strict';

describe("test wallet", function(){

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

    it('is defined as a class', function() {
        var miner = bcNetworkProvider.createWallet("test", []);
        expect(typeof(miner)).toEqual("object");
    });


    it('assigns utxos to wallet', function() {
        var wallet = bcNetworkProvider.createWallet("test", [{amount: 20},
            {amount: 10}]);

        expect(wallet.utxos.length).toEqual(2);
    });

    it('assigns name to wallet', function() {
        var wallet = bcNetworkProvider.createWallet("test", [{amount: 20},
            {amount: 10}]);

        expect(wallet.name).toEqual("test");
    });

    it('address starts with 1 and increments onwards', function() {
        for(var i = 1; i < 4; i++) {
            var wallet = bcNetworkProvider.createWallet("test", [{amount: 20},
                {amount: 10}]);
            expect(wallet.address).toEqual(i);
        }
    });


    describe("onNewBlock", function(){
        var walletSender, walletReceiver, walletIgnored;
        var block;
        var blockWithChange;

        beforeEach(function() {
            walletSender = bcNetworkProvider.createWallet("sender", [{amount: 20},
                {amount: 10}]);

            walletReceiver = bcNetworkProvider.createWallet("receiver", []);

            walletIgnored = bcNetworkProvider.createWallet("ignored", []);

            block = {isDummy: false, isFork: false, transactions: [{
                    from: walletSender.address,
                    to: walletReceiver.address,
                    amount: 10,
                    utxos: [{id: 1,amount: 10}],
                    change: 0,
                }]};

            blockWithChange = {isDummy: false, isFork: false, transactions: [{
                    from: walletSender.address,
                    to: walletReceiver.address,
                    amount: 9,
                    utxos: [{id: 2,amount: 10}],
                    change: 1,
                }]};
        });

       it('dummy blocks are ignored', function() {
            block.isDummy = true;

            walletReceiver.onNewBlock(block);
            expect(walletReceiver.utxos.length).toEqual(0);
        });

        it('fork blocks are ignored', function() {
            block.isFork = true;

            walletReceiver.onNewBlock(block);
            expect(walletReceiver.utxos.length).toEqual(0);
        });

        it('received utxos are added', function() {
            walletReceiver.onNewBlock(block);
            expect(walletReceiver.utxos.length).toEqual(1);
        });

        it('no side effect should occur if no transaction is sent to wallet', function() {
            walletIgnored.onNewBlock(block);
            expect(walletReceiver.utxos.length).toEqual(0);
        });

        it('utxo with amount of transaction is created', function() {
            walletReceiver.onNewBlock(block);
            expect(walletReceiver.utxos[0].amount).toEqual(10);
        });

        it('spent utxos are removed', function() {
            walletSender.onNewBlock(block);
            expect(walletSender.utxos.length).toEqual(1);
        });

        it('change is added as a new utxo', function() {
            walletSender.onNewBlock(blockWithChange);
            walletReceiver.onNewBlock(blockWithChange);
            expect(walletReceiver.utxos[0].amount).toEqual(9);
        });

    });


});