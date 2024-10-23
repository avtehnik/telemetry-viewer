"use strict";
const serialport = require("serialport");
const fs = require("fs");

let SerialPort = function (baudRate, portName, cb) {

    let self = {};
    self.onData = cb;
    self.udp = null;
    let privateScope = {portName: null};

    /**
     *
     * @param baudRate
     * @param portName
     * @param cb
     */
    privateScope.portName = portName;
    self.port = new serialport.SerialPort({
        baudRate: baudRate,
        path: portName
    }, false);

    self.port.on('error', function (e) {
        console.error(e.toString())
        console.error('serial error', arguments, portName);
    });

    self.port.on('open', function () {
        console.log('port open', portName, baudRate);
        // feed the protocol with new data coming from the port
    });
    self.port.on('data', function (data) {
        if (self.onData) {
            self.onData(data);
        }
    });
    self.portWrite = function (message, cb) {
        // console.log(toHexString(message));
        //console.log(message.toString());
        if (self.udp) {
            self.udp.send(message);
        }
        self.port.write(message, function (err, res) {
            // res = num of chars written
            if (cb) {
                cb({bytesSent: message.length});
            }
            if (err) {
                console.error("Error writing to port", privateScope.portName);
                console.error(err);
                return;
            }
        });
    }

    self.setUDP = function (udp) {
        self.udp = udp;
    }

    return self;
};

module.exports = {
    SerialPort: SerialPort,
    search: function (prefix = 'tty.usbserial') {
        var files = fs.readdirSync('/dev/');
        var port = files.find((file) => {
            return file.indexOf(prefix) !== -1
        });
        port = '/dev/' + port;
        return  port;
    }
};