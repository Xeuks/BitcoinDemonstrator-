'use strict';

angular
	.module('myApp')
	.config( function($locationProvider, $routeProvider, bitcoinNetworkProvider) {

		var w1 = bitcoinNetworkProvider.createWallet([
			{amount: 20},
			{amount: 10},
			{amount: 5},
		]);

		var w2 = bitcoinNetworkProvider.createWallet( [
			{amount: 10}
		]);

		var m1 = bitcoinNetworkProvider.createMiner([
			{amount: 50	}
		]);

		var m2 = bitcoinNetworkProvider.createMiner([
			{amount: 20}
		]);

		var m3 = bitcoinNetworkProvider.createMiner([
			{amount: 5}
		]);

		bitcoinNetworkProvider.createBitcoinNetwork([w1,w2], [m1,m2,m3]);

		var blockchainNetwork = bitcoinNetworkProvider.$get();


		//blockchainNetwork


        $locationProvider.hashPrefix('!');
        $routeProvider.otherwise({redirectTo: '/blockchain_demo'});
	});