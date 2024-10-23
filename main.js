var fs = require("fs");
var serialPort = require("./src/lib/serial-port.js");
const {PacketLengthParser} = require('@serialport/parser-packet-length')
var wss = require("./src/lib/http.js");
var telemetryParser = require("./src/lib/telemetry-parser.js");
var sessionStartTime = process.uptime();

let isRecording = false;
let port = new serialPort.SerialPort(115200, serialPort.search('HC'), (data) => {
})
let writer = null;

const parser = port.port.pipe(new PacketLengthParser({
    delimiter: 0xEA,
    lengthOffset: 1,
    lengthBytes: 1
}))

parser.on('data', function (data) {
    try {
        let parsed = telemetryParser.parse(data);
        parsed.time = process.uptime() - sessionStartTime;

        if (isRecording && writer) {
            writer.write(JSON.stringify(parsed) + "\n");
        }
        // console.log(parsed);
        wss.clients.forEach(function each(client) {
            client.send(JSON.stringify(parsed));
        });
    } catch (e) {
        console.log(data);
        return;
    }
})



wss.on('connection', function (ws, req) {
//    ws.send(JSON.stringify(process.memoryUsage()), function () {});
    ws.uid = wss.getUniqueID();
    ws.on('message', function (data) {
        let message = JSON.parse(data.toString());//
        if (message.type === 'recording') {
            if (message.data){
                sessionStartTime = process.uptime();
                let yourDate = new Date()
                let dayDate = yourDate.toISOString().split('T')[0] + '__' + yourDate.getHours() + '-' + yourDate.getMinutes();
                writer = fs.createWriteStream('data/crsf_telemetry_' + dayDate + '.txt');
                isRecording = true;
            }else {
                writer.end();
                isRecording = false;
            }
        }
    })
    ws.on('close', function () {
        console.log('ws close');
    });
});

