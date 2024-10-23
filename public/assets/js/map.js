
let lat = 0;
let lng = 0;

let MAP = {
    lat:0, lng:0,
    map: L.map('map').setView([lat, lng], 13),
    lines: {
        flightPath: {
            path: L.polyline([], {color: 'red'}),
            latlngs: [],
        },
    },
    icons: {
        directionIcon:
            L.icon({
                iconUrl: '/assets/arrow.png',
                iconSize: [50, 50], // size of the icon
                iconAnchor: [0, 25], // point of the icon which will correspond to marker's location
            }),
        droneIcon: L.icon({
            iconUrl: '/assets/uav-quadcopter.50x50.png',
            iconSize: [50, 50], // size of the icon
            iconAnchor: [25, 25], // point of the icon which will correspond to marker's location
        })
    },
    markers: {
        droneDirectionMarker: L.marker([0, 0]),
        droneMarker: L.marker([0, 0])
    },
    init: function () {
        MAP.map = L.map('map').setView([MAP.lat, MAP.lng], 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(MAP.map);

        MAP.markers.droneDirectionMarker = L.marker([lat, lng], {icon: MAP.icons.directionIcon}).addTo(MAP.map);
        MAP.markers.droneMarker = L.marker([MAP.lat, MAP.lng], {icon: MAP.icons.droneIcon}).addTo(MAP.map);

        MAP.markers.droneMarker.setIcon(MAP.icons.droneIcon);
        MAP.markers.droneMarker.addTo(MAP.map);
        MAP.lines.flightPath.path.addTo(MAP.map);
        // MAP.markers.droneDirectionMarker.setRotationOrigin([0, 0]);
        MAP.markers.droneMarker.setLatLng([lat, lng]);
        MAP.markers.droneDirectionMarker.setLatLng([lat, lng]);
        MAP.markers.droneDirectionMarker.setRotationAngle(30);
        MAP.markers.droneMarker.setRotationAngle(30);
    },
    methods: {
        addFlightPoint: function (lat, lng) {
            MAP.lines.flightPath.latlngs.push([lat, lng]);
            MAP.lines.flightPath.path.setLatLngs(MAP.lines.flightPath.latlngs);
        },
        clear(){
            MAP.lines.flightPath.latlngs = [];
            MAP.lines.flightPath.path.setLatLngs(MAP.lat, MAP.lng);
        },
        setDronePosition: function (lat, lng, heading) {
            MAP.markers.droneMarker.setLatLng([lat, lng]);
            MAP.markers.droneDirectionMarker.setLatLng([lat, lng]);
            MAP.markers.droneDirectionMarker.setRotationAngle(heading-90);
            MAP.markers.droneMarker.setRotationAngle(heading);
            MAP.map.setView([lat, lng]);
        },
    },
}