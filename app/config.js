'use strict';

angular
	.module('myApp').config( function($locationProvider, $routeProvider, bitcoinNetworkProvider) {



		var miners = [];


		var w1 = bitcoinNetworkProvider.createWallet(1, [
			{amount: 20},
			{amount: 15},
			{amount: 5}
		]);

		var w2 = bitcoinNetworkProvider.createWallet(2, [
			{amount: 10}
		]);


		var genesisBlock = {
			transactions: [
				{ from: 0, to: 1, Amount: 20},{ from: 0, to: 1, Amount: 15},{ from: 0, to: 1, Amount: 5},
				{ from: 0, to: 2, Amount: 10}
			],
			PoWAnswer:0,
			PoWChallange:0,
			parentBlock:0,
			siblings:[]
		};


		bitcoinNetworkProvider.createBitcoinNetwork(genesisBlock, [w1,w2], miners);



        $locationProvider.hashPrefix('!');

        $routeProvider.otherwise({redirectTo: '/wallet_demo'});
	});