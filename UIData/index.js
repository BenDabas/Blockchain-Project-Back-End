const express = require('express');

const UIData = require('./UIData');
const setHeader = require('./SetHeader');
const Interpreter = require('../Interpreter');

const app = express();
const port = process.env.PORT || 3001;

app.use(setHeader);

app.use(express.json());

app.use(UIData);
app.use(Interpreter);

app.listen(port, () => {
	console.log('Hello');
});
