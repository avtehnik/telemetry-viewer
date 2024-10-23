//https://github.com/EdgeTX/edgetx/blob/cb87f82d1569449295ecb387104af132da53574e/radio/src/telemetry/crossfire.cpp
//https://github.com/CrazyDude1994/android-taranis-smartport-telemetry/blob/883d40b97ff6dfebc890f996fee651bdcb5a26d5/app/src/main/java/crazydude/com/telemetry/protocol/CrsfProtocol.kt#L59

//https://medium.com/@mike_polo/parsing-crsf-protocol-from-a-flight-controller-with-a-raspberry-pi-for-telemetry-data-79e9426ff943
let TelemetryParser = {
    powerValues: [0, 10, 25, 100, 500, 1000, 2000, 250, 50],
    types: {
        RADIO_ADDRESS: 0xEA,
        GPS_TYPE: 0x02,
        VARIO_TYPE: 0x07,
        HEARTBEAT_TYPE : 0x0B,
        PING_TYPE: 0x28,
        DEVICE_INFO_TYPE :0x29,
        BATTERY_TYPE: 0x08,
        LINK_STATS: 0x14,
        ATTITUDE_TYPE: 0x1E,
        FLIGHT_MODE: 0x21,
        RADIO_ID: 0x3A
    },
    parser: {
        GPS_TYPE: function (data) {
            let gps = {
                time:0,
                type: TelemetryParser.types.GPS_TYPE,
                latitude: data.readInt32BE(3) / 10000000,
                longitude: data.readInt32BE(7) / 10000000,
                groundSpeed: data.readUInt16BE(11) /100,
                heading: data.readUInt16BE(13) / 100,
                altitude: data.readUint8(15),//??
                satellites: data.readUint8(17),//??
            }
            // console.log(gps);
            return gps;
        },
        VARIO_TYPE: function (data) {
            let vario = {
                time:0,
                type: TelemetryParser.types.VARIO_TYPE,
                vspd: data.readInt16BE(3)/10
            }
            return vario;
        },
        BATTERY_TYPE: function (data) {
            let battery = {
                time:0,
                type: TelemetryParser.types.BATTERY_TYPE,
                voltage: data.readUInt16BE(3) / 10,//??
                current: data.readUInt16BE(5) / 10,//??
                capacity: (data[7] << 16) | (data[8] << 7) | data[9],
                pct: data[10]
            }
            return battery;
        },
        LINK_STATS: function (data) {
            let lq = {
                time:0,
                type: TelemetryParser.types.LINK_STATS,
                uplinkRssi1: data.readInt8(2),
                uplinkRssi2: data.readInt8(3),
                uplinkLinkQuality: data.readInt8(4),
                uplinkSnr: data.readInt8(5),
                activeAntenna: data.readInt8(6),
                rfMode: data.readUint8(7), //rsnr
                uplinkTxPower: TelemetryParser.powerValues[data.readInt8(8)],
                downlinkRssi1: data.readInt8(9),
                downlinkLinkQuality: data.readInt8(10),
                downlinkSnr: data.readInt8(11),
                rssi: 0
            }
            lq.rssi = lq.activeAntenna == 1 ? lq.uplinkRssi1 : lq.uplinkRssi2;
            return lq;
        },
        ATTITUDE_TYPE: function (data) {
            let attitude = {
                time:0,
                type: TelemetryParser.types.ATTITUDE_TYPE,
                pitchRad: data.readInt16BE(3) / 10000,
                rollRad: data.readInt16BE(5) / 10000,
                yawRad: data.readInt16BE(7) / 10000,
                roll: 0,
                pitch: 0,
                yaw: 0,
            }
            attitude.pitch = attitude.pitchRad * 180 / Math.PI
            attitude.roll = attitude.rollRad * 180 / Math.PI
            attitude.yaw = attitude.yawRad * 180 / Math.PI
            return attitude;
        },
        FLIGHT_MODE: function (data) {
            return {
                time:0,
                type: TelemetryParser.types.FLIGHT_MODE,
                mode: data.toString()
            }
        },
        RADIO_ID: function (data) {
            // console.log(data.toString('hex'));
            let radio = {
                time:0,
                type: TelemetryParser.types.RADIO_ID,
                update_interval: data.readUInt32BE(3),
                offset: data.readInt32BE(7) / 10000,
            }
            // console.log(radio);
            return radio;
        },

    },
    parse: function (data) {
        switch (data[2]) {
            case TelemetryParser.types.LINK_STATS:
                return TelemetryParser.parser.LINK_STATS(data);
                break;
            case TelemetryParser.types.GPS_TYPE:
                return TelemetryParser.parser.GPS_TYPE(data);
                break;
            case TelemetryParser.types.BATTERY_TYPE:
                return TelemetryParser.parser.BATTERY_TYPE(data);
                break;
            case TelemetryParser.types.FLIGHT_MODE:
                return TelemetryParser.parser.FLIGHT_MODE(data);
                break;
            case TelemetryParser.types.ATTITUDE_TYPE:
                return TelemetryParser.parser.ATTITUDE_TYPE(data);
                break;
            case TelemetryParser.types.RADIO_ID:
                return TelemetryParser.parser.RADIO_ID(data);
                break;
            case TelemetryParser.types.VARIO_TYPE:
                return TelemetryParser.parser.VARIO_TYPE(data);
                break;
            default:
                return {
                    type: data[2]
                };
        }
    }
}
module.exports = TelemetryParser;