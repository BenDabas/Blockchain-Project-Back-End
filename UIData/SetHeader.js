const setHeader = (req, res, next) => {
	const allowedOrigins = [
		'http://localhost:3000',
		'http://localhost:3001',
		'http://localhost:3000//verify-transaction',
		'http://localhost:3001//verify-transaction',
		'http://localhost:3000//create-transaction',
		'http://localhost:3001//create-transaction',
		'http://localhost:3000/get-balance',
		'http://localhost:3001//get-balance',
		'http://localhost:3000//get-transactions',
		'http://localhost:3001//get-transactions',
		'http://localhost:3001//get-block-trie',
		'http://localhost:3000//get-block-trie',
		'http://localhost:3000//get-interpreter-response',
		'http://localhost:3001//get-interpreter-response',
		'http://localhost:3000//get-block-state-trie',
		'http://localhost:3001//get-block-state-trie',
		'http://localhost:3000//get-blockchain-trie',
		'http://localhost:3001//get-blockchain-trie',
	];
	const origin = req.headers.origin;
	if (allowedOrigins.includes(origin)) {
		res.setHeader('Access-Control-Allow-Origin', origin);
	}
	// Website you wish to allow to connect
	// res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
	// Request methods you wish to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	// Request headers you wish to allow
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', true);

	// Pass to next layer of middleware
	next();
};

module.exports = setHeader;
