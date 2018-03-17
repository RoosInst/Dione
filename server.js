const compression = require('compression');
const express = require('express');
const path = require('path');
const port = process.env.PORT || 8080;
const app = express();

app.use(compression());
app.use(express.static(__dirname + '/dist'));
app.use(express.static(__dirname + '/public'));

app.listen(port);
console.info("Server started on port " + port);
