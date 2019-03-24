'use strict';

angular
	.module('myApp').config( function(bitcoinNetworkProvider) {
		bitcoinNetworkProvider.initializeBlockchain();
		
	});