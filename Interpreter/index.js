const express = require('express');

const Interpreter = require('./interpreter');

const router = new express.Router();

router.post('/get-interpreter-response', async (req, res) => {
	try {
		let code = req.body;
		let codeArray = Object.values(code);
		codeArray = codeArray.filter((el) => el !== '');
		try {
			result = new Interpreter().runCode(codeArray);
		} catch (error) {}

		res.status(200).send(result);
	} catch (error) {}
});

module.exports = router;
