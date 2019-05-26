'use strict'
angular
    .module('myApp').provider("bitcoinNetwork", function() {
        var bcNetwork;
        var curAddress = 1;

        this.createMiner = function(name, utxos) {
            return  new Miner(name, curAddress++, utxos);
        };

        this.createWallet = function(name, utxos) {
            return new Wallet(name, curAddress++, utxos);
        };

        this.createGenesisTransaction = function(node) {
            var amount = 0;
            node.utxos.forEach(function (utxo) {
                amount += utxo.amount;
            });
            return {from: 0, to: node.address, amount: amount, utxos : node.utxos, fee: 0, change:0};
        };

        this.createBitcoinNetwork = function(wallets, miners) {
            var gensisTransactions = [];

            var nodes = [].concat(wallets).concat(miners);
            nodes.forEach(function(node) {
                var amount = 0;
                var utxoList = [];
                node.utxos.forEach(function (utxo) {
                    amount += utxo.amount;
                    utxoList.push({amount: utxo.amount});
                });
                var tx =  {from: 0, to: node.address, amount: amount, utxos : utxoList, fee: 0, change:0};
                gensisTransactions.push(tx);
            });

            var genesisBlock = new Block(0, gensisTransactions, 0 , "");
            genesisBlock.calculateNextHash();
            genesisBlock.height = 0;



            bcNetwork = new BitcoinNetwork(genesisBlock, wallets, miners);

        };

        this.$get = function() {

            return bcNetwork;
        };
    });


function BitcoinNetwork(genesisBlock, wallets, miners) {
    this.blockchain = [[genesisBlock]];

    this.wallets = wallets;

    this.miners = miners;

    this.difficulty = 1;

    this.listeners = [];

    this.getMiners = function() {
        return this.miners;
    };

    this.getWallets = function() {
        return [].concat(this.wallets);
    };

    this.getNodes = function() {
        return [].concat(this.wallets).concat(this.miners);
    };

    this.getWalletNameByWalletId = function (walletId) {
        var wallet = this.getNodes().find(function(node) {
            return node.address === walletId;
        });

        return (wallet !== undefined) ? wallet.name : "";
    };

    this.getBlockchain = function() {
        return this.blockchain;
    };

    this.getGenesisBlock = function() {
        return this.blockchain[0][0];
    };

    this.getCurrentHead = function () {
        var currentHeight = this.blockchain.length-1;

        // always consider the first block as the head of the main chain
        return this.blockchain[currentHeight][0];
    };

    this.addListener = function (listener) {
        this.listeners.push(listener);
    };

    this.removeListener = function (listener) {
        var idx = this.listeners.indexOf(listener);
        this.listeners.splice(idx, 1);
    };

    this.addBlockToBlockchain = function(block) {
        var currentHeadIdx = this.blockchain.length - 1;

        var isParentInHead = this.blockchain[currentHeadIdx].some(function(headBlock) {
           return headBlock.hash === block.parentBlockHash;
        });

        block.isFork = !isParentInHead;
        if(isParentInHead) {
            this.blockchain.push([block]);
        } else {
            //parent is in prev
            this.blockchain[currentHeadIdx].push(block);
        }
    };

    this.onNewBlockMined = function(block) {
        this.addBlockToBlockchain(block);
        this.propagateBlock(block);
    };

    this.propagateBlock = function (block) {
        var subscribers = this.listeners
            .concat(this.wallets)
            .concat(this.miners);

        subscribers.forEach(function (node) {
            if (typeof node.onNewBlock === 'function')
                node.onNewBlock(block);
        });
    };

    this.propagateTransaction = function (transaction) {
        var subscribers = this.listeners
            .concat(this.miners);

        subscribers.forEach(function (node) {
            if (typeof(node.onNewTransaction) === 'function')
                node.onNewTransaction(transaction);
        });
    };

    this.createTransaction = function(fromWallet, toWallet, amount, fee, utxos) {
        var utxosList = [];

        var curTxAmount = 0;

        if(typeof(utxos) === 'undefined')
        {

            for(var idx = 0; curTxAmount < amount && idx < fromWallet.utxos.length; idx++)
            {
                curTxAmount += fromWallet.utxos[idx].amount;
                utxosList.push(fromWallet.utxos[idx]);
            }


            if(curTxAmount < amount)
            {
                throw new Error('Transaction could not be build because wallet has not enough bitcoins!');
            }
        }
        else
        {
            utxosList = [].concat(utxos);
        }

        return new Transaction(fromWallet.address, toWallet.address, amount, fee, utxosList);
    };

    this.createBlock = function(minedBy, transactions, difficulty, parentBlockHash) {
        return new Block(minedBy, transactions, difficulty, parentBlockHash);
    };
}

function Block(minedBy, transactions, difficulty, parentBlockHash) {
    this.minedBy = minedBy;
    this.transactions = transactions;
    this.difficulty = difficulty;
    this.nonce = 0;
    this.hash = "";
    this.parentBlockHash = parentBlockHash;
    this.isDummy = false;
    this.isFork = false;

    this.calculateNextHash = function() {
        this.nonce++;
        this.hash =  sha256(this.toString());

        return this.hash;
    };

    this.isValid = function() {
        return this.hash.startsWith(difficulty);
    };

    this.toString = function() {
        var stringRepresentation =
            String(this.minedBy) + String(this.nonce) + String(this.parentBlockHash);

        this.transactions.forEach(function (transaction) {
            stringRepresentation = stringRepresentation + transaction.toString();
        });

        return stringRepresentation;
    };
}

function Wallet(name, address, utxos) {
    this.name = name;
    this.address = address;
    this.utxos = [];
    this.utxoId = 0;

    this.createNewUtxo = function(amount) {
        this.utxoId++;
        return {amount: amount, id: this.utxoId};
    };

    var that = this;
    utxos.forEach(function(utxo) {
        that.utxos.push(that.createNewUtxo(utxo.amount));
    });

    this.onNewBlock = function (block) {
        if (!block.isDummy && !block.isFork) {
            var that = this;
            block.transactions.forEach(function (transaction) {

               if(transaction.from === that.address) {
                    transaction.utxos.forEach(function (transactionUtxo) {
                        var idx = that.utxos.findIndex(function(curUtxo) {
                            return transactionUtxo.id === curUtxo.id;
                        });

                        if(idx !== -1){
                            that.utxos.splice(idx, 1);
                        } else {

                            idx = that.utxos.findIndex(function (curUtxo) {
                                return transactionUtxo.amount === curUtxo.amount;
                            });
                            that.utxos.splice(idx, 1);
                        }

                        if(transaction.change > 0) {
                            that.utxos.push(that.createNewUtxo(transaction.change));
                        }
                    });
                }

                if(transaction.to === that.address) {
                    that.utxos.push(that.createNewUtxo(transaction.amount));
                }
            });

        }
    };


}

function Miner(name, address, utxos) {
    this.name = name;
    this.address = address;
    this.utxos = [];
    this.utxoId = 0;
    this.mempool = [];
    this.parentHash = "";

    this.candidateBlock = null;

    this.onNewTransaction = function (transaction) {
        this.mempool.push(transaction);
    };

    this.createNewUtxo = function(amount) {
        this.utxoId++;
        return {amount: amount, id: this.utxoId};
    };

    var that = this;
    utxos.forEach(function(utxo) {
        that.utxos.push(that.createNewUtxo(utxo.amount));
    });

    this.onNewBlock = function (block) {
        if (!block.isDummy && !block.isFork) {
            var that = this;
            block.transactions.forEach(function (transaction) {

                if(transaction.from === that.address) {
                    transaction.utxos.forEach(function (transactionUtxo) {
                        var idx = that.utxos.findIndex(function(curUtxo) {
                            return transactionUtxo.id === curUtxo.id;
                        });

                        if(idx !== -1){
                            that.utxos.splice(idx, 1);
                        } else {

                            idx = that.utxos.findIndex(function (curUtxo) {
                                return transactionUtxo.amount === curUtxo.amount;
                            });
                            that.utxos.splice(idx, 1);
                        }

                        if(transaction.change > 0) {
                            that.utxos.push(that.createNewUtxo(transaction.change));
                        }
                    });
                }

                if(transaction.to === that.address) {
                    that.utxos.push(that.createNewUtxo(transaction.amount));
                }
            });

            this.parentHash = block.hash;
            this.mempool = [];
        }
    };

    this.createCandidateBlock = function(difficulty) {
        var reward = 10;
        this.mempool.forEach(function (transaction) {
            reward += transaction.fee;
        });

        var coinbaseTx = new Transaction(0, this.address, reward, 0, [{amount: reward}]);
        var transactions = [coinbaseTx];
        var that = this;
        this.mempool.forEach(function (tx, idx) {
            if(that.isMempoolTransactionValid(idx)) {
                transactions.push(tx);
            }
        });

        this.candidateBlock = new Block(this.address, transactions, difficulty, this.parentHash);
    };

    this.isMempoolTransactionValid = function (txIdx) {
        var isValid = true;
        var tx = this.mempool[txIdx];
        this.mempool.forEach(function(mempoolTx, mempoolIdx){
            if(txIdx !== mempoolIdx && tx.from === mempoolTx.from) {
                isValid = isValid && tx.utxos.every(function(txUtxo) {
                    return mempoolTx.utxos.every(function (utxo) {
                        return utxo.id !== txUtxo.id;
                    });
                });
            }
        });

        return isValid;
    };
}

function Transaction(fromWallet, toWallet, amount, fee, utxos) {
    this.from = fromWallet;
    this.to = toWallet;
    this.amount = amount;
    this.fee = fee;
    this.change = 0;

    var curTxAmount = 0;

    utxos.forEach(function(utxo){
        curTxAmount += utxo.amount;
    });
    this.utxos = utxos;

    var change = curTxAmount - amount - fee;

    if(change > 0)
    {
        this.change = change;
    }

    this.toString = function() {
        return String(this.from) + String(this.to) + String(this.amount) + String(this.fee);
    };
}