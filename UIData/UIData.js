const { PartitionedBloomFilter } = require('bloom-filters');
const { MerkleTree } = require('merkletreejs');
const { timeStamp } = require('console');
const express = require('express');
const router = new express.Router();
const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const { Blockchain, Block, Transaction } = require('../Blockchain/blockchain');
let coinJson = require('../Mempool/MBcoinBlockChain.json');

let sendTransaction;
let hashTransResponse = 0;

const michelleKey = ec.keyFromPrivate(
	'fe60676e40f5ab7f8d100033f392f636b889e1dad75a7ed1cc0cee0e2931a024'
);
const michelleAddress = michelleKey.getPublic('hex');

const benKey = ec.keyFromPrivate(
	'e1d6c9046d6e27d148795dc64b54de5e8d3f515f2733990d596326ad4d685e70'
);
const benAddress = benKey.getPublic('hex');

const minerKey = ec.keyFromPrivate(
	'aaa180500ab9fb316dc88e2f81181fe2badf2a3fc2aeb6ed0f1fca92b0eb558a'
);
const minerAddress = minerKey.getPublic('hex');

let MBcoin = new Blockchain();
MBcoin.chain = coinJson.chain;
MBcoin.pendingTransactions = coinJson.pendingTransactions;
let toAddressHash;
let fromAddressHash;
let signKeyHash;
let amount;

const insert = () => {
	for (let block of MBcoin.chain) {
		let filter = new PartitionedBloomFilter(4, 4);
		let leaves = [];

		for (let trans of block.transactions) {
			if ('Genesis block'.includes(trans)) {
				continue;
			}
			if (trans.fromAddress === null) {
				continue;
			}
			filter.add(trans.hashTransaction);
			leaves.push(trans.hashTransaction);
		}
		block.bloomFilter = filter;
		let tree = new MerkleTree(leaves, SHA256);
		block.merkleTree = tree;
	}
};

insert();

router.post('/verify-transaction', async (req, res) => {
	try {
		const hashTransaction = req.body;
		console.log('The hash to be verified: ', hashTransaction);
		let answer = MBcoin.verifyTransaction(hashTransaction.hashTransaction);
		if (!answer) {
			sendTransaction = 'Could not verify the transaction';
		} else {
			sendTransaction = MBcoin.getTransaction(hashTransaction.hashTransaction);
			if (sendTransaction.fromAddress === benAddress)
				sendTransaction = { ...sendTransaction, fromAddress: 'Ben' };
			if (sendTransaction.toAddress === benAddress)
				sendTransaction = { ...sendTransaction, toAddress: 'Ben' };
			if (sendTransaction.fromAddress === michelleAddress)
				sendTransaction = { ...sendTransaction, fromAddress: 'Michelle' };
			if (sendTransaction.toAddress === michelleAddress)
				sendTransaction = { ...sendTransaction, toAddress: 'Michelle' };
			if (sendTransaction.fromAddress === minerAddress)
				sendTransaction = { ...sendTransaction, fromAddress: 'Miner' };
			if (sendTransaction.toAddress === minerAddress)
				sendTransaction = { ...sendTransaction, toAddress: 'Miner' };
		}

		return res.status(200).send();
	} catch (err) {
		return res.send();
	}
});

router.post('/create-transaction', async (req, res) => {
	try {
		let transaction = req.body;
		console.log('The details from user:', transaction);
		switch (transaction.toAddress) {
			case 'Ben':
				toAddressHash = benAddress;
				break;
			case 'Michelle':
				toAddressHash = michelleAddress;
				break;
			case 'Miner':
				toAddressHash = minerAddress;
				break;
		}
		switch (transaction.fromAddress) {
			case 'Ben':
				fromAddressHash = benAddress;
				signKeyHash = benKey;
				break;
			case 'Michelle':
				fromAddressHash = michelleAddress;
				signKeyHash = michelleKey;
				break;
			case 'Miner':
				fromAddressHash = minerAddress;
				signKeyHash = minerKey;
				break;
		}
		amount = transaction.amount;
		let tx = new Transaction(fromAddressHash, toAddressHash, amount);
		try {
			tx.signTransaction(signKeyHash);
			MBcoin.addTransaction(tx);
			if (MBcoin.pendingTransactions.length === 4) {
				MBcoin.miningPendingTransactions(minerAddress);
			}
		} catch (err) {}
		hashTransResponse = tx.hashTransaction;
		return await res.send({ ts });
	} catch (err) {
		return res.send(err);
	}
});

router.post('/get-balance', async (req, res) => {
	try {
		let address = req.body.Address;

		switch (address) {
			case 'Ben':
				address = benAddress;
				break;
			case 'Michelle':
				address = michelleAddress;
				break;
			case 'Miner':
				address = minerAddress;
				break;
		}

		const balance = MBcoin.getBalanceOfAddress(address);

		return await res.status(200).send({ balance });
	} catch (err) {
		return res.send(err);
	}
});

router.post('/get-transactions', async (req, res) => {
	try {
		let address = req.body;

		switch (address.address) {
			case 'Ben':
				address = benAddress;
				break;
			case 'Michelle':
				address = michelleAddress;
				break;
			case 'Miner':
				address = minerAddress;
				break;
		}

		const balance = MBcoin.getAllTransactions(address);

		return await res.status(200).send({ balance });
	} catch (err) {
		return res.send(err);
	}
});

router.post('/get-block-trie', async (req, res) => {
	try {
		let hashTransaction = req.body;

		console.log('get-block-trie:', hashTransaction.hashTransaction);
		const blockTrie = MBcoin.getBlockTrie(hashTransaction.hashTransaction);
		console.log('From post get-block-trie', blockTrie);

		return await res.status(200).send(blockTrie);
	} catch (error) {
		return res.send(error);
	}
});

router.post('/get-block-state-trie', async (req, res) => {
	try {
		let hashTransaction = req.body;

		console.log('get-block-state-trie:', hashTransaction.hashTransaction);
		const blockStateTrie = MBcoin.getBlockStateTrie(hashTransaction.hashTransaction);
		console.log('From post get-block-state-trie', blockStateTrie);
		return await res.status(200).send(blockStateTrie);
	} catch (error) {
		return res.send(error);
	}
});

router.get('/create-transaction', async (req, res) => {
	try {
		let jsonRes = JSON.stringify(hashTransResponse);
		console.log('The hash of the new transaction: ', hashTransResponse);

		res.status(200).send(jsonRes);
	} catch (error) {
		res.status(400).send();
	}
});

router.get('/verify-transaction', async (req, res) => {
	try {
		let jsonRes = JSON.stringify(sendTransaction);
		console.log('The verified transaction: ', sendTransaction);
		res.status(200).send(jsonRes);
	} catch (error) {
		res.status(400).send();
	}
});

router.get('/get-blockchain-trie', async (req, res) => {
	try {
		const blockchainTrie = MBcoin.getBlockchainTrie();
		console.log('blockchainTrie in UIDATA router', blockchainTrie);
		res.status(200).send({ blockchainTrie });
	} catch (error) {}
});

module.exports = router;
