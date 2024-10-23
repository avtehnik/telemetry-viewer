"use strict";
var msp = require("./msp.js");

var protocol = new msp.Protocol();


//crsf rx raw range 174....1800
//betaflight range 900....2100


function encodeMSPMessage(code, data) {
    let message = protocol.message_encode(code, data);
    return message;
}


function convertToPWM(value, limitRange = 32688) {
    // Перевірка, чи виходить за межі діапазону [0, 1]
    // Конвертація
    const minPWM = 1000;
    const maxPWM = 2000;
    const range = limitRange - (limitRange * -1);
    const offsetValue = value + limitRange; // Зміщення значення, щоб воно було додатнім
    const scaledValue = (offsetValue / range) * (maxPWM - minPWM);
    const pwm = minPWM + scaledValue;
    return Math.round(pwm); // Округлення до цілого значення
}

function convertToCRSF(value, limitRange = 32688) {
    // Перевірка, чи виходить за межі діапазону [0, 1]
    // Конвертація
    const minPWM = 172;
    const maxPWM = 1811;
    const range = limitRange - (limitRange * -1);
    const offsetValue = value + limitRange; // Зміщення значення, щоб воно було додатнім
    const scaledValue = (offsetValue / range) * (maxPWM - minPWM);
    const pwm = minPWM + scaledValue;
    return Math.round(pwm); // Округлення до цілого значення
}

function convertToAngle(value) {
    let limitRange = 55 * Math.PI / 180;
    const minPWM = 172;
    const maxPWM = 1812;
    const range = limitRange - (limitRange * -1);
    return (value - minPWM) * range / (maxPWM - minPWM) - limitRange;
}


function convertToCRSF2(value) {
    // Перевірка, чи виходить за межі діапазону [0, 1]
    // Конвертація
    // const minPWM = 1000;
    // const maxPWM = 2000;

    const minPWM = 172;
    const maxPWM = 1811;

    const range = 32767;
    const offsetValue = value; // Зміщення значення, щоб воно було додатнім
    const scaledValue = (offsetValue / range) * (maxPWM - minPWM);
    const pwm = minPWM + scaledValue;
    return Math.round(pwm); // Округлення до цілого значення
}

function map(x, in_min, in_max, out_min, out_max, round = true) {

    if (round) {
        return Math.round((x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min);
    }
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

let minOut = 900;
let maxOut = 2100;

function convertToMSP(value) {
    let val = map(value, 174, 1812, minOut, maxOut);
    if (val < minOut) {
        val = minOut;
        // console.error("out off range", value);
    } else if (val > maxOut) {
        val = maxOut
        // console.error("out off range", value);
    }
    return val;
}

function tanh(x) {
    let e2x = Math.exp(x * 2);
    return (e2x - 1) / (e2x + 1);
}

function channelsToJoystick(channels) {

//aux1 - e
//aux2 - f
//aux3 - b
//aux4 - c
//aux5 - button a
//aux6 - button d

    //900...2110
    let joystick = {};
    joystick.roll = convertToMSP(channels[0]);
    joystick.pitch = convertToMSP(channels[1]);
    joystick.throttle = convertToMSP(channels[2]);
    joystick.yaw = convertToMSP(channels[3]);
    joystick.aux1 = convertToMSP(channels[4]);
    joystick.aux2 = convertToMSP(channels[5]);
    joystick.aux3 = convertToMSP(channels[6]);
    joystick.aux4 = convertToMSP(channels[7]);
    joystick.aux5 = convertToMSP(channels[8]);
    joystick.aux6 = convertToMSP(channels[9]);
    joystick.aux7 = convertToMSP(channels[10]);
    joystick.aux8 = convertToMSP(channels[11]);
    joystick.aux9 = convertToMSP(channels[12]);
    joystick.aux10 = convertToMSP(channels[13]);
    joystick.aux11 = convertToMSP(channels[14]);
    joystick.aux12 = convertToMSP(channels[15]);

    joystick.a = channels[8] > 1000;
    joystick.d = channels[9] > 1000;
    joystick.l = channels[10];
    joystick.r = channels[11];


    return joystick;
}

function getSwitchStateCRSF(val) {
    if (val < 800) {
        return 0
    } else if (val < 1000) {
        return 1
    }
    return 2
}

function isSwitchStateCRSF(val, state) {
    return getSwitchStateCRSF(val) === state;
}

module.exports = {
    encodeMSPMessage: encodeMSPMessage,
    convertToPWM: convertToPWM,
    convertToCRSF: convertToCRSF,
    convertToCRSF2: convertToCRSF2,
    convertToAngle: convertToAngle,
    tanh: tanh,
    channelsToJoystick: channelsToJoystick,
    map: map,
    getSwitchStateCRSF: getSwitchStateCRSF,
    isSwitchStateCRSF: isSwitchStateCRSF,
    isFloat: function isFloat(n) {
        return Number(n) === n && n % 1 !== 0;
    },
    getDeltaAngle: function () {
        var TAU = 360;
        var mod = function (a, n) {
            return (a % n + n) % n;
        } // modulo
        var equivalent = function (a) {
            return mod(a + 180, TAU) - 180
        } // [-π, +π]
        return function (current, target) {
            return equivalent(target - current);
        }
    }()
};