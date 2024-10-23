"use strict";

var express = require('express');
var http = require('http');
var ws = require('ws');
const {createServer} = require("http");
let webPort = 3000;

const app = express();
app.use(express.static('./public'));
app.get('/check', (req, res) => {
    res.send({'result': 'ok'});
});
const server = createServer(app);
const wss = new ws.WebSocketServer({server});

wss.getUniqueID = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return s4() + s4() + '-' + s4();
};

server.listen(webPort, function () {
    console.log('Listening on http://localhost:' + webPort);
});


module.exports = wss;