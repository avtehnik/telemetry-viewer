let ws = new WebSocket("ws://" + location.host);


let INSTRUMENTS = {
    attitude: null,
    heading: null,
    variometer: null,
    airspeed: null,
    altimeter: null,
    turn_coordinator: null,
};

let vueApp = new Vue({
    el: "#app",
    data: {
        gpsLink: "",
        timeDiff: 0,
        recording: false,
        ui: {
            follow: false
        },
        telemetry: {
            vario: {
                vspd: 0,
            },
            time: 0,
            distance: 0,
            distanceToHome: 0,
            prevLocation: {
                lat: 0,
                lng: 0,
            },
            homeLocation: {
                lat: 0,
                lng: 0,
            },
            flightMode: "",
            linkStats: {
                uplinkRssi1: 0,
                uplinkRssi2: 0,
                uplinkLinkQuality: 0,
                uplinkSnr: 0,
                activeAntenna: 0,
                rfMode: 0, //rsnr
                uplinkTxPower: 0,
                downlinkRssi1: 0,
                downlinkLinkQuality: 0,
                downlinkSnr: 0,
                rssi: 0
            },
            attitude: {
                roll: 0,
                pitch: 0,
                yaw: 0,
            },
            battery: {
                voltage: 0,
                current: 0,
                capacity: 0,
                pct: 0,
            },
            gps: {
                latitude: 0,
                longitude: 0,
                groundSpeed: 0,
                heading: 0,
                altitude: 0,
                satellites: 0,
            }
        },
    },
    mounted() {
        let angle = 0
        // setInterval(() => {
        //     const xhr = new XMLHttpRequest();
        //     xhr.open("GET", "/check");
        //     xhr.send();
        //     xhr.responseType = "json";
        //     xhr.onload = () => {
        //         if (xhr.status == 200) {
        //             if (ws.readyState == WebSocket.CLOSED) {
        //                 console.log('ws is CLOSED');
        //                 ws = new WebSocket("ws://" + window.localStorage['trackingServer'] + ":3000");
        //                 ws.onmessage = function (event) {
        //                 };
        //             }
        //         } else {
        //             console.log(`Error: ${xhr.status}`);
        //         }
        //     };
        //     // angle +=10;
        //     // MAP.markers.droneDirectionMarker.setRotationAngle(angle);
        //     // MAP.markers.droneMarker.setRotationAngle(angle);
        //
        //
        // }, 100);

        INSTRUMENTS.attitude = $.flightIndicator('#attitude', 'attitude', {
            roll: 50,
            pitch: -20,
            size: 200,
            showBox: true,
            img_directory: 'assets/fi/img/'
        });
        INSTRUMENTS.heading = $.flightIndicator('#heading', 'heading', {
            heading: 150,
            showBox: true,
            img_directory: 'assets/fi/img/'
        });
        INSTRUMENTS.variometer = $.flightIndicator('#variometer', 'variometer', {
            vario: -5,
            showBox: true,
            img_directory: 'assets/fi/img/'
        });
        INSTRUMENTS.airspeed = $.flightIndicator('#airspeed', 'airspeed', {
            showBox: false,
            img_directory: 'assets/fi/img/'
        });
        INSTRUMENTS.altimeter = $.flightIndicator('#altimeter', 'altimeter', {img_directory: 'assets/fi/img/'});
        INSTRUMENTS.turn_coordinator = $.flightIndicator('#turn_coordinator', 'turn_coordinator', {
            turn: 0,
            img_directory: 'assets/fi/img/'
        });
        INSTRUMENTS.variometer.setVario(0);
        setTimeout(MAP.init, 100);
        // MAP.init();
        CHART.makeChart("Link_stats", {
            lines: {
                "uplinkRssi1": "red",
                "uplinkRssi2": "blue",
                "uplinkLinkQuality": "green",
                "uplinkSnr": "yellow",
                "activeAntenna": "purple",
                "rfMode": "orange",
                "uplinkTxPower": "black",
                "downlinkRssi1": "brown",
                "downlinkLinkQuality": "pink",
                "downlinkSnr": "gray",
                "rssi": "cyan",
            }
        });
        CHART.makeChart("Battery", {
            lines: {
                "Voltage": "red",
                "Current": "blue",
                "Capacity": "cyan",
                "Pct%": "gray",
            }
        });
        CHART.makeChart("GPS", {
            lines: {
                "Altitude": "red",
                "Ground Speed": "blue",
                "Distance to home": "green",
                "vspd": "cyan",
            }
        });
        CHART.makeChart("Attitude", {
            lines: {
                "roll": "yellow",
                "pitch": "purple",
                "yaw": "orange",
            }
        });
    },
    beforeMount() {
    },
    methods: {
        wsConnect() {
            ws = new WebSocket("ws://" + window.localStorage['trackingServer'] + ":3000");
            ws.onmessage = function (event) {
                const packet = JSON.parse(event.data);
                vueApp.prosessPacket(packet);
            }
        },
        selectDataFile(event) {
            const input = event.target.files[0];
            if (input) {
                CHART.clear();
                this.clear();
                const reader = new FileReader();
                reader.onload = (e) => {
                    const text = e.target.result;
                    let lines = text.split('\n');
                    let interval = setInterval(() => {
                        this.prosessPacket(JSON.parse(lines.shift()));
                        if (lines.length === 1) {
                            clearInterval(interval);
                        }
                    }, 10);
                };
                reader.readAsText(input);
            }
        },
        prosessPacket(packet) {
            this.telemetry.time = packet.time.toFixed(2);
            if (packet.type === 0x02) {
                // if (!init) {
                //     MAP.map.setView([packet.latitude, packet.longitude], 13);
                //     init = true;
                // }
                MAP.methods.addFlightPoint(packet.latitude, packet.longitude);
                MAP.methods.setDronePosition(packet.latitude, packet.longitude, packet.heading);
                vueApp.updateGps(packet);
            } else if (packet.type === 0x14) {
                vueApp.updateLinkStats(packet);
            } else if (packet.type === 0x07) {
                vueApp.updateVario(packet);
            } else if (packet.type === 0x08) {
                vueApp.updateBattery(packet);
            } else if (packet.type === 0x1E) {
                vueApp.updateAttitude(packet);
            } else if (packet.type === 0x21) {
                vueApp.updateFlightMode(packet);
            }
        },
        clear() {
            CHART.clear();
            MAP.methods.clear();
            this.telemetry.distance = 0;
            this.homeLocation = {
                lat: 0,
                lng: 0,
            };
            this.prevLocation = {
                lat: 0,
                lng: 0,
            };
        },
        updateRecording() {
            this.recording = !this.recording;
            console.log(this.recording);
            ws.send(JSON.stringify({type: 'recording', data: this.recording}));
        },
        updateLinkStats(data) {
            this.telemetry.linkStats.uplinkRssi1 = data.uplinkRssi1;
            this.telemetry.linkStats.uplinkRssi2 = data.uplinkRssi2;
            this.telemetry.linkStats.uplinkLinkQuality = data.uplinkLinkQuality;
            this.telemetry.linkStats.uplinkSnr = data.uplinkSnr;
            this.telemetry.linkStats.activeAntenna = data.activeAntenna;
            this.telemetry.linkStats.rfMode = data.rfMode; //rsnr
            this.telemetry.linkStats.uplinkTxPower = data.uplinkTxPower;
            this.telemetry.linkStats.downlinkRssi1 = data.downlinkRssi1;
            this.telemetry.linkStats.downlinkLinkQuality = data.downlinkLinkQuality;
            this.telemetry.linkStats.downlinkSnr = data.downlinkSnr;
            this.telemetry.linkStats.rssi = data.rssi;

            let chart = [
                this.telemetry.linkStats.uplinkRssi1,
                this.telemetry.linkStats.uplinkRssi2,
                this.telemetry.linkStats.uplinkLinkQuality,
                this.telemetry.linkStats.uplinkSnr,
                this.telemetry.linkStats.activeAntenna,
                this.telemetry.linkStats.rfMode,
                this.telemetry.linkStats.uplinkTxPower,
                this.telemetry.linkStats.downlinkRssi1,
                this.telemetry.linkStats.downlinkLinkQuality,
                this.telemetry.linkStats.downlinkSnr,
                this.telemetry.linkStats.rssi,
            ]
            CHART.addData("Link_stats", chart, this.telemetry.time);
        },
        updateAttitude(data) {
            this.telemetry.attitude.roll = data.roll;
            this.telemetry.attitude.pitch = data.pitch;
            this.telemetry.attitude.yaw = data.yaw;

            INSTRUMENTS.attitude.setRoll(this.telemetry.attitude.roll);
            INSTRUMENTS.attitude.setPitch(this.telemetry.attitude.pitch);
            INSTRUMENTS.turn_coordinator.setTurn(this.telemetry.attitude.roll);

            let chart = [
                this.telemetry.attitude.roll,
                this.telemetry.attitude.pitch,
                this.telemetry.attitude.yaw,
            ]
            CHART.addData("Attitude", chart, this.telemetry.time);
        },
        updateFlightMode(data) {
            this.telemetry.flightMode = data.mode;
        },
        updateVario(data) {
            console.log(data);
            this.telemetry.vario.vspd = data.vspd / 1000;
            console.log(this.telemetry.vario.vspd);
            INSTRUMENTS.variometer.setVario(data.vspd / 1000);
        },
        updateBattery(data) {
            this.telemetry.battery.voltage = data.voltage;
            this.telemetry.battery.current = data.current;
            this.telemetry.battery.capacity = data.capacity;
            this.telemetry.battery.pct = data.pct;
            let chart = [
                this.telemetry.battery.voltage,
                this.telemetry.battery.current,
                this.telemetry.battery.capacity,
                this.telemetry.battery.pct,
            ]
            CHART.addData("Battery", chart, this.telemetry.time);
        },
        updateGps(data) {
            if (this.telemetry.prevLocation.lat && this.telemetry.prevLocation.lng) {
                this.telemetry.distance += haversineDistance(this.telemetry.prevLocation.lat, this.telemetry.prevLocation.lng, data.latitude, data.longitude);
            }
            if (this.telemetry.homeLocation.lat === 0 && this.telemetry.homeLocation.lng === 0) {
                this.telemetry.homeLocation.lat = data.latitude;
                this.telemetry.homeLocation.lng = data.longitude;

            }
            this.telemetry.distanceToHome = haversineDistance(this.telemetry.homeLocation.lat, this.telemetry.homeLocation.lng, data.latitude, data.longitude);

            this.telemetry.index = this.telemetry.distance;
            this.telemetry.prevLocation.lat = data.latitude;
            this.telemetry.prevLocation.lng = data.longitude;

            this.telemetry.gps.latitude = data.latitude;
            this.telemetry.gps.longitude = data.longitude;
            this.telemetry.gps.groundSpeed = data.groundSpeed * 3.6;
            this.telemetry.gps.heading = data.heading;
            this.telemetry.gps.altitude = data.altitude;
            this.telemetry.gps.satellites = data.satellites;

            this.gpsLink = `https://www.google.com/maps/search/?q=@${data.latitude},${data.longitude}`;

            INSTRUMENTS.airspeed.setAirSpeed(data.groundSpeed * 1.94384449);
            INSTRUMENTS.altimeter.setAltitude(this.telemetry.gps.altitude * 3.280839895);
            INSTRUMENTS.altimeter.setPressure(1000 + 3 * Math.sin(this.telemetry.gps.altitude / 50));
            INSTRUMENTS.heading.setHeading(this.telemetry.gps.heading);

            let chart = [
                this.telemetry.gps.altitude,
                this.telemetry.gps.groundSpeed,
                this.telemetry.distanceToHome,
                this.telemetry.vario.vspd
            ]
            CHART.addData("GPS", chart, this.telemetry.time);
        }
    },
    computed: {},
});


let init = false;
// zoom the map to the polyline
ws.onmessage = function (event) {
    const packet = JSON.parse(event.data);
    vueApp.prosessPacket(packet);
}