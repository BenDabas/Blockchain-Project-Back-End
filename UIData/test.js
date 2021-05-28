const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const { Blockchain, Block, Transaction } = require('../Blockchain/blockchain');

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

let tx1 = new Transaction(michelleAddress, benAddress, 60);
tx1.signTransaction(michelleKey);
MBcoin.addTransaction(tx1);

let tx2 = new Transaction(benAddress, michelleAddress, 125);
tx2.signTransaction(benKey);
MBcoin.addTransaction(tx2);

let tx3 = new Transaction(michelleAddress, benAddress, 130);
tx3.signTransaction(michelleKey);
MBcoin.addTransaction(tx3);

let tx4 = new Transaction(michelleAddress, benAddress, 35);
tx4.signTransaction(michelleKey);
MBcoin.addTransaction(tx4);

MBcoin.miningPendingTransactions(minerAddress);

tx1 = new Transaction(michelleAddress, benAddress, 90);
tx1.signTransaction(michelleKey);
MBcoin.addTransaction(tx1);

tx2 = new Transaction(benAddress, michelleAddress, 30);
tx2.signTransaction(benKey);
MBcoin.addTransaction(tx2);

tx3 = new Transaction(michelleAddress, benAddress, 140);
tx3.signTransaction(michelleKey);
MBcoin.addTransaction(tx3);

tx4 = new Transaction(michelleAddress, benAddress, 170);
tx4.signTransaction(michelleKey);
MBcoin.addTransaction(tx4);

MBcoin.miningPendingTransactions(minerAddress);

tx1 = new Transaction(michelleAddress, benAddress, 50);
tx1.signTransaction(michelleKey);
MBcoin.addTransaction(tx1);

tx2 = new Transaction(benAddress, michelleAddress, 360);
tx2.signTransaction(benKey);
MBcoin.addTransaction(tx2);

let aa = JSON.stringify(MBcoin);
