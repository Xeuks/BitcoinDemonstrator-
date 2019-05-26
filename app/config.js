'use strict';

angular
	.module('myApp')
	.config( function($locationProvider, $routeProvider, bitcoinNetworkProvider) {

		var w1 = bitcoinNetworkProvider.createWallet("Alice",[
			{amount: 20},
			{amount: 10},
			{amount: 5},
			{amount: 50},
			{amount: 20},
		]);

		var w2 = bitcoinNetworkProvider.createWallet("Bob", [
			/*{amount: 10}*/
		]);

		var m1 = bitcoinNetworkProvider.createMiner("Eve",[
			/*{amount: 50	}*/
		]);

		var m2 = bitcoinNetworkProvider.createMiner("Tom",[
			/*{amount: 20}*/
		]);

		var m3 = bitcoinNetworkProvider.createMiner("John",[
			/*{amount: 5}*/
		]);

		bitcoinNetworkProvider.createBitcoinNetwork([w1,w2], [m1,m2,m3]);

		var blockchainNetwork = bitcoinNetworkProvider.$get();
		var genesisBlock = blockchainNetwork.getGenesisBlock();

		var sampelTxBlock1 = [];
		sampelTxBlock1.push(
			{from: 0, to: 3, amount: 10, utxos : [{amount: 10}], fee: 0, change:0},
			{from: 1, to: 2, amount: 5, utxos : [{amount: 20}], fee: 0, change:15},
			{from: 1, to: 3, amount: 49, utxos : [{amount: 50}], fee: 1, change:0},
			{from: 1, to: 4, amount: 20, utxos : [{amount: 20}], fee: 0, change:0},
			{from: 1, to: 5, amount: 5, utxos : [{amount: 5}], fee: 0, change:0}
		);
		var block1 = blockchainNetwork.createBlock(3, sampelTxBlock1, "00", genesisBlock.hash);
		block1.nonce = 230;
		block1.hash = "004ea51d48bc0a191a1b8ac47d14fc08099f2003b55cf55aacb6d55d362d1e4b";

		var sampleTxBlock2 = [];
		sampleTxBlock2.push(
			{from: 0, to: 5, amount: 17, utxos : [{amount: 17}], fee: 0, change:0},
			{from: 2, to: 4, amount: 3, utxos : [{amount: 5}], fee: 0.5, change:0.5},
			{from: 3, to: 1, amount: 10, utxos : [{amount: 49}], fee: 4, change:35},
			{from: 4, to: 2, amount: 5.5, utxos : [{amount: 20}], fee: 2.5, change:12});
		var block2 = blockchainNetwork.createBlock(5, sampleTxBlock2, "00", block1.hash);
		block2.nonce = 2;
		block2.hash = "0083d30c81f5948f8734a5a2d03861b2eea304c35356bcb790d7a7e18525bdd2";

		var sampleTxBlock3 = [];
		sampleTxBlock3.push(
			{from: 0, to: 4, amount: 10.1, utxos : [{amount: 17}], fee: 0, change:0},
			{from: 3, to: 2, amount: 14, utxos : [{amount: 17}], fee: 0.1, change:2.9}
		);

		var block3 = blockchainNetwork.createBlock(4, sampleTxBlock3, "00", block2.hash);
		block3.nonce = 23;
		block3.hash = "00233861b2eea304c3544fc08099f20861b2eea304c07a7e185248f8734a5a2d";


		var sampleTxBlock4 = [];
		sampleTxBlock4.push(
			{from: 0, to: 5, amount: 10.05, utxos : [{amount: 17}], fee: 0, change:0},
			{from: 3, to: 1, amount: 14.95, utxos : [{amount: 17}], fee: 0.05, change:2}
		);


		var block4 = blockchainNetwork.createBlock(5, sampleTxBlock4, "00", block2.hash);
		block4.nonce = 2;
		block4.hash = "0083d30c4c07a7e1852487e18525b33348bc0a191a1b8ac47d91a1b8ac41b2ee";

		[block1, block2, block3, block4].forEach(function(block) {
			blockchainNetwork.onNewBlockMined(block);
		});


		blockchainNetwork.getMiners().forEach(function(miner) {
			miner.parentHash = "00233861b2eea304c3544fc08099f20861b2eea304c07a7e185248f8734a5a2d";
		});


        $locationProvider.hashPrefix('!');
        $routeProvider.otherwise({redirectTo: '/startpage'});
	});