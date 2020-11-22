const Gpio = require("onoff").Gpio;
const server = require('http').createServer();
const config = require("./config");
const bonjour = require("bonjour")();
const sessionio = require('socket.io')(server);
const tallyio = require('socket.io-client');
const os = require('os');
const ifaces = os.networkInterfaces();
const { v4: uuidv4 } = require('uuid');

const programLed = new Gpio(config.programGpio, 'out');
const previewLed = new Gpio(config.previewGpio, 'out');

var TallySocket;
var lastState;
var deviceId;

const setDevId = function() {
    console.log("Generating new ID");
    return uuidv4();
}

const getDevId = function() {
    if (!deviceId || deviceId === null) {
        deviceId = setDevId();
    }
    console.log("Device ID" + deviceId);
    return deviceId;
}

const updateTally = function() {
    programLed.write(0);
    previewLed.write(0);
    if (!lastState.programSourceIds || !lastState.previewSourceIds)
        return;

    if (lastState.programSourceIds.includes(config.camera)) {
        programLed.write(1);
    } else if (lastState.previewSourceIds.includes(config.camera)) {
        previewLed.write(1);
    }
}

const exitHandler = function(options, exitCode) {
    programLed.write(0);
    previewLed.write(0);
    if (options.cleanup) console.log('clean');
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
}

server.listen(3778);

config.camera = 1;

bonjour.publish({
    name: "ATEM Tally Pi Listener",
    type: "dsft-tally-pi",
    port: 3778,
    txt: {
        id: getDevId()
    }
});

//do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));
process.on('SIGINT', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));

sessionio.on('connection', (socket) => {

    socket.on('pi_host_connect', function(msg) {

        if (TallySocket) {
            console.log("Already have an active connection");
            return;
        }

        var host = msg;

        TallySocket = new tallyio(host);

        TallySocket.on('connect', function() {
            console.log("Connected to server ");
        });

        TallySocket.on('update_tally', function(msg) {
            lastState = msg;
            updateTally();
        });

        TallySocket.on('call', function(msg) {
            programLed.write(0);
            setTimeout(() => { programLed.write(1); }, 250);
            setTimeout(() => { programLed.write(0); }, 500);
            setTimeout(() => { programLed.write(1); }, 750);
            setTimeout(() => { programLed.write(0); }, 1000);
            setTimeout(() => { updateTally(); }, 1000);
        });

        TallySocket.on('set_remote', function(msg) {
            if (msg.devId == getDevId() || msg.devId == '*') {
                if (msg.camera) {
                    config.camera = msg.camera;
                    updateTally();
                }

                if (msg.identify) {
                    programLed.write(0);
                    setTimeout(() => { programLed.write(1); }, 250);
                    setTimeout(() => { programLed.write(0); }, 500);
                    setTimeout(() => { programLed.write(1); }, 750);
                    setTimeout(() => { programLed.write(0); }, 1000);
                    setTimeout(() => { programLed.write(1); }, 1250);
                    setTimeout(() => { programLed.write(0); }, 1500);
                    setTimeout(() => { programLed.write(1); }, 1750);
                    setTimeout(() => { updateTally(); }, 2000);
                }
            }
        });

        TallySocket.on('stop_tally', function(msg) {
            console.log(msg);
            Object.keys(ifaces).forEach(function(ifname) {

                ifaces[ifname].forEach(function(iface) {
                    if (iface.address == msg) {
                        TallySocket.disconnect();
                    }
                });
            });
        });

        TallySocket.on('disconnect', function() {
            console.log("Disconnected from server");
            programLed.write(0);
            previewLed.write(0);
            TallySocket = null;
        });
    });
});