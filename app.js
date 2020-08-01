const Gpio = require("onoff").Gpio;
const server = require('http').createServer();
const config = require("./config");
const bonjour = require("bonjour")();
const sessionio = require('socket.io')(server);
const tallyio = require('socket.io-client');
const os = require('os');
const ifaces = os.networkInterfaces();

var TallySocket;

server.listen(3778);

bonjour.publish({ name: "ATEM Tally Pi Listener", type: "dsft-tally-pi", port: 3778 });

const programLed = new Gpio(config.programGpio, 'out');
const previewLed = new Gpio(config.previewGpio, 'out');

function exitHandler(options, exitCode) {
    programLed.write( 0 );
    previewLed.write( 0 );
    if (options.cleanup) console.log('clean');
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));
process.on('SIGINT', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
        
sessionio.on('connection', (socket) => {

	socket.on('pi_host_connect', function(msg) {

		if (TallySocket)
            return;

        var host = msg;

        TallySocket = new tallyio(host);
        
        TallySocket.on('connect', function (){
            console.log("Connected to server ");
        });

        TallySocket.on('update_tally', function(msg) {
            programLed.write( 0 );
            previewLed.write( 0 );
            if (msg.programSourceIds.includes(config.camera)) {
                programLed.write( 1 );
            } else if (msg.previewSourceIds.includes(config.camera)) {
                previewLed.write( 1 );
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

        TallySocket.on('disconnect', function(){
            console.log("Disconnected from server");
            programLed.write( 0 );
            previewLed.write( 0 );
            TallySocket = null;
        });
	});
});
