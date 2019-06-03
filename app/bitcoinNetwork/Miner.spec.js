'use strict';

describe("test miner", function(){

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
        var miner = bcNetworkProvider.createMiner("test", []);
        expect(typeof(miner)).toEqual("object");
    });


    it('assigns utxos to wallet', function() {
        var miner = bcNetworkProvider.createMiner("test", [{amount: 20},
            {amount: 10}]);

        expect(miner.utxos.length).toEqual(2);
    });

    it('assigns name to wallet', function() {
        var miner = bcNetworkProvider.createMiner("test", [{amount: 20},
            {amount: 10}]);

        expect(miner.name).toEqual("test");
    });

    it('address starts with 1 and increments onwards', function() {
        for(var i = 1; i < 4; i++) {
            var wallet = bcNetworkProvider.createMiner("test", [{amount: 20},
                {amount: 10}]);
            expect(wallet.address).toEqual(i);
        }
    });


    describe("onNewBlock", function(){
        var minerSender, minerReceiver, minerIgnored;
        var block;
        var blockWithChange;

        beforeEach(function() {
            minerSender = bcNetworkProvider.createMiner("sender", [{amount: 20},
                {amount: 10}]);

            minerReceiver = bcNetworkProvider.createMiner("receiver", []);

            minerIgnored = bcNetworkProvider.createMiner("ignored", []);

            block = {isDummy: false, isFork: false, transactions: [{
                    from: minerSender.address,
                    to: minerReceiver.address,
                    amount: 10,
                    utxos: [{id: 1,amount: 10}],
                    change: 0,
                }]};

            blockWithChange = {isDummy: false, isFork: false, transactions: [{
                    from: minerSender.address,
                    to: minerReceiver.address,
                    amount: 9,
                    utxos: [{id: 2,amount: 10}],
                    change: 1,
                }]};
        });

        it('dummy blocks are ignored', function() {
            block.isDummy = true;

            minerReceiver.onNewBlock(block);
            expect(minerReceiver.utxos.length).toEqual(0);
        });

        it('fork blocks are ignored', function() {
            block.isFork = true;

            minerReceiver.onNewBlock(block);
            expect(minerReceiver.utxos.length).toEqual(0);
        });

        it('received utxos are added', function() {
            minerReceiver.onNewBlock(block);
            expect(minerReceiver.utxos.length).toEqual(1);
        });

        it('no side effect should occur if no transaction is sent to wallet', function() {
            minerIgnored.onNewBlock(block);
            expect(minerReceiver.utxos.length).toEqual(0);
        });

        it('utxo with amount of transaction is created', function() {
            minerReceiver.onNewBlock(block);
            expect(minerReceiver.utxos[0].amount).toEqual(10);
        });

        it('spent utxos are removed', function() {
            minerSender.onNewBlock(block);
            expect(minerSender.utxos.length).toEqual(1);
        });

        it('change is added as a new utxo', function() {
            minerSender.onNewBlock(blockWithChange);
            minerReceiver.onNewBlock(blockWithChange);
            expect(minerReceiver.utxos[0].amount).toEqual(9);
        });

    });


    describe("onNewTransaction", function() {
        var miner;
        var transaction;

        beforeEach(function () {
            miner = bcNetworkProvider.createMiner("miner", []);

            transaction = {
                from: 1,
                to: 2,
                amount: 10,
                utxos: [{id: 1, amount: 10}],
                change: 0,
            };
        });

        it('transaction is added to mempool', function () {
            miner.onNewTransaction(transaction);
            expect(miner.mempool.length).toEqual(1);
        });
    });


    describe("createCandidateBlock", function() {
        var miner;
        var tx, invalidTx;

        beforeEach(function () {
            miner = bcNetworkProvider.createMiner("miner", []);



            tx = {
                from: 1,
                to: 2,
                amount: 9,
                fee: 1,
                utxos: [{id: 1, amount: 10}],
                change: 0,
            };

            invalidTx = {
                from: 1,
                to: 2,
                amount: 9,
                fee: 1,
                utxos: [{id: 1, amount: 10}],
                change: 0,
            };
        });

        it('block will be generated', function () {
            miner.onNewTransaction(tx);
            miner.createCandidateBlock("0");

            expect(typeof(miner.candidateBlock)).toEqual("object");
        });

        it('coinbase transaction is included in candidate block', function () {
            miner.onNewTransaction(tx);
            miner.createCandidateBlock("0");

            expect(miner.candidateBlock.transactions.length).toEqual(2);
        });

        it('coinbase transaction amount is sum of fees plus reward', function () {
            miner.onNewTransaction(tx);
            miner.createCandidateBlock("0");

            expect(miner.candidateBlock.transactions[0].amount).toEqual(11);
        });

        it('invalid transaction should not be included in candidate block', function () {
            miner.onNewTransaction(tx);
            miner.onNewTransaction(invalidTx);
            miner.isMempoolTransactionValid = function(idx) {return idx===1;};
            miner.createCandidateBlock("0");

            expect(miner.candidateBlock.transactions.length).toEqual(2);
        });
    });


    describe("isMempoolTransactionValid", function() {
        var miner;
        var transaction1,transaction2;

        beforeEach(function () {
            miner = bcNetworkProvider.createMiner("miner", []);

            transaction1 = {
                from: 1,
                to: 2,
                amount: 10,
                utxos: [{id: 1, amount: 10}],
                change: 0,
            };

            transaction2 = {
                from: 1,
                to: 3,
                amount: 10,
                utxos: [{id: 1, amount: 10}],
                change: 0,
            };
        });

        it('is false when transaction utxos are already spent in another transaction', function () {
            miner.onNewTransaction(transaction1);
            miner.onNewTransaction({
                from: 1,
                to: 3,
                amount: 10,
                utxos: [{id: 1, amount: 10}],
                change: 0,
            });
            expect(miner.isMempoolTransactionValid(1)).toEqual(false);
        });

        it('is true when transaction utxos are not used in any other mempool transaction', function () {
            miner.onNewTransaction(transaction1);
            miner.onNewTransaction({
                from: 1,
                to: 3,
                amount: 10,
                utxos: [{id: 2, amount: 10}],
                change: 0,
            });
            expect(miner.isMempoolTransactionValid(1)).toEqual(true);
        });
    });
});