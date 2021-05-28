const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const { MerkleTree } = require('merkletreejs');
const crypto = require('crypto');
const { PartitionedBloomFilter } = require('bloom-filters');
const ec = new EC('secp256k1');

class Transaction {
	constructor(fromAddress, toAddress, amount) {
		this.fromAddress = fromAddress;
		this.toAddress = toAddress;
		this.amount = amount;
		this.timesTamp = Date.now();
		this.hashTransaction;
	}

	calculateHash() {
		return SHA256(this.fromAddress + this.toAddress + this.amount + this.timesTamp).toString();
	}

	signTransaction(signingKey) {
		if (signingKey.getPublic('hex') !== this.fromAddress) {
			throw new Error('You can not sign transaction for other wallet');
		}
		this.hashTransaction = this.calculateHash();
		const sig = signingKey.sign(this.hashTransaction, 'base64');
		this.signature = sig.toDER('hex');
	}

	isValid() {
		if (this.fromAddress === null) {
			return true;
		}

		if (!this.signature || this.signature === 0) {
			throw new Error('No signature in this transaction');
		}

		const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
		return publicKey.verify(this.calculateHash(), this.signature);
	}
}

class Block {
	constructor(timesTamp, transactions, previousHash = '', tree, bloomFilter, trie, stateTrie) {
		this.timesTamp = timesTamp;
		this.transactions = transactions;
		this.previousHash = previousHash;
		this.hash = this.calculateHash();
		this.nonce = 0;
		this.merkleTree = tree;
		this.bloomFilter = bloomFilter;
		this.trie = trie;
		this.stateTrie = stateTrie;
	}

	calculateHash() {
		return SHA256(
			this.previousHash + this.timesTamp + JSON.stringify(this.transactions) + this.nonce
		).toString();
	}

	mineBlock(difficulty) {
		while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
			this.nonce++;
			this.hash = this.calculateHash();
		}
	}

	hasValidTransactions() {
		for (const tx of this.transactions) {
			if (!tx.isValid()) {
				return false;
			}
		}
		return true;
	}
}

class Blockchain {
	constructor() {
		this.chain = [this.createGenesisBlock()];
		this.difficulty = 2;
		this.pendingTransactions = [];
		this.miningReward = 100;
		this.trans;
	}

	getBlockTrie(hashTransaction) {
		try {
			for (let block of this.chain) {
				let root = block.merkleTree.getRoot().toString('hex');
				let proof = block.merkleTree.getProof(hashTransaction);
				if (block.merkleTree.verify(proof, hashTransaction, root)) {
					return block.trie;
				}
			}
		} catch (e) {}
	}

	getBlockStateTrie(hashTransaction) {
		try {
			for (let block of this.chain) {
				let root = block.merkleTree.getRoot().toString('hex');
				let proof = block.merkleTree.getProof(hashTransaction);
				if (block.merkleTree.verify(proof, hashTransaction, root)) {
					return block.stateTrie;
				}
			}
		} catch (e) {}
	}

	getBlockchainTrie() {
		try {
			let blockchainTrie = [];
			for (let block of this.chain) {
				blockchainTrie.push(block.trie);
			}
			console.log('blockcainTrie in getAllBlockchainTrie in blockchain', blockchainTrie);
			return blockchainTrie;
		} catch (e) {}
	}

	verifyTransaction(hashTransaction) {
		let bloomF = false;
		let merkleT = false;
		let leaf = hashTransaction;
		for (let block of this.chain) {
			let bloomFilter = block.bloomFilter;
			bloomFilter.has(hashTransaction);

			if (bloomFilter.has(hashTransaction)) {
				bloomF = true;
				break;
			}
		}

		console.log('verifyTransaction: bloom filter done', bloomF);
		if (bloomF) {
			try {
				for (let block of this.chain) {
					let root = block.merkleTree.getRoot().toString('hex');

					let proof = block.merkleTree.getProof(leaf);

					if (block.merkleTree.verify(proof, leaf, root)) {
						merkleT = true;
						break;
					}
				}
			} catch (e) {}
		}

		let trie1 = this.getBlockTrie(hashTransaction);

		return merkleT;
	}

	getTransaction(hashTransaction) {
		for (const block of this.chain) {
			for (const trans of block.transactions) {
				if (trans.hashTransaction === hashTransaction) {
					return trans;
				}
			}
		}

		return false; //Not found transaction
	}

	createGenesisBlock() {
		return new Block('01/11/2020', 'Genesis block', '0');
	}

	getLatestBlock() {
		return this.chain[this.chain.length - 1];
	}

	miningPendingTransactions(miningRewardAddress) {
		const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
		this.pendingTransactions.push(rewardTx);
		let filter = new PartitionedBloomFilter(4, 4);
		filter.add(this.pendingTransactions[0].hashTransaction);
		filter.add(this.pendingTransactions[1].hashTransaction);
		filter.add(this.pendingTransactions[2].hashTransaction);
		filter.add(this.pendingTransactions[3].hashTransaction);

		let leaves = [
			this.pendingTransactions[0].hashTransaction,
			this.pendingTransactions[1].hashTransaction,
			this.pendingTransactions[2].hashTransaction,
			this.pendingTransactions[3].hashTransaction,
		];
		const tree = new MerkleTree(leaves, SHA256);
		console.log('Mining');

		let trie = this.CreateNewTrie(leaves);
		let code = ['code'];
		const benAddress =
			'04e63db30a12ac0f70e78321798a58724902d586508208b43d76c2eb74c1c6aed8fcd017cb8aa60655685a0e1505eae3e358dd8444052348456024eaac4000a3ea';
		const michelleAddress =
			'040cf1d73f7961e96f55aad0f68acdd53f4e8698e95f57a50bd3f881bd5085753a3325a3a9c9e65bd8b6ce6b41e0353d63deec2d0b340ae751da35730550b386fa';
		const minerAddress =
			'0466a67903d8d2fec0882f7a13e69fe1df35704ab8c22e79e420327e3dc65e47d6d3e761027352a9590810976c575b959bed2ab433267bffa8a6678b764f96ac72';
		const micaAddress =
			'043aca677ca104ee6506b12c0a59495d35e1d1a9d060829444e603ab568773b5c1e4faf92ec8516e479b444d72896a249a3ad9be6179786174acffba8dbd20c907';

		let states = [
			SHA256(benAddress, code, this.getBalanceOfAddress(benAddress)).toString(),
			SHA256(michelleAddress, code, this.getBalanceOfAddress(michelleAddress)).toString(),
			SHA256(minerAddress, code, this.getBalanceOfAddress(minerAddress)).toString(),
			SHA256(micaAddress, code, this.getBalanceOfAddress(micaAddress)).toString(),
		];
		let stateTrie = this.CreateNewTrie(states);

		let block = new Block(
			Date.now(),
			this.pendingTransactions,
			this.getLatestBlock().hash,
			tree,
			filter,
			trie,
			stateTrie
		);

		block.mineBlock(this.difficulty);

		console.log('Block successfully mined.');

		this.chain.push(block);
		this.pendingTransactions = [];
	}

	CreateNewTrie(leaves) {
		leaves.push(SHA256(leaves[0] + leaves[1]).toString());
		leaves.push(SHA256(leaves[2] + leaves[3]).toString());
		leaves.push(SHA256(leaves[4] + leaves[5]).toString());
		let trie = {
			name: leaves[6],
			children: [
				{
					name: leaves[4],
					children: [
						{
							name: leaves[0],
							children: [],
						},
						{
							name: leaves[1],
							children: [],
						},
					],
				},
				{
					name: leaves[5],
					children: [
						{
							name: leaves[2],
							children: [],
						},
						{
							name: leaves[3],
							children: [],
						},
					],
				},
			],
		};
		return trie;
	}

	addTransaction(transaction) {
		if (!transaction.fromAddress || !transaction.toAddress) {
			throw new Error('Transaction must include from and to address');
		}
		if (!transaction.isValid()) {
			throw new Error('Cannot add invalid transaction to the chain');
		}
		this.pendingTransactions.push(transaction);
	}

	getBalanceOfAddress(address) {
		let balance = 1000;
		for (const block of this.chain) {
			for (const trans of block.transactions) {
				if (trans.fromAddress === address) {
					balance -= Number(trans.amount);
				}
				if (trans.toAddress === address) {
					balance += Number(trans.amount);
				}
			}
		}
		console.log('Balance from getBalanceOfAddress: ', balance);

		return balance;
	}

	getAllTransactions(address) {
		let allTrans = [];
		for (const block of this.chain) {
			for (const trans of block.transactions) {
				if (trans.fromAddress === address || trans.toAddress === address) {
					allTrans.push(trans);
				}
			}
		}
		return allTrans;
	}

	isChainValid() {
		for (let i = 1; i < this.chain.length; i++) {
			const currentBlock = this.chain[i];
			const previousBlock = this.chain[i - 1];

			if (!currentBlock.hasValidTransactions()) {
				return false;
			}

			if (currentBlock.hash !== currentBlock.calculateHash()) {
				return false;
			}
			if (currentBlock.previousHash !== previousBlock.hash) {
				return false;
			}
			return true;
		}
	}
}

module.exports.Blockchain = Blockchain;
module.exports.Block = Block;
module.exports.Transaction = Transaction;
