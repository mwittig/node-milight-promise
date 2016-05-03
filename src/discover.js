var Promise = require('bluebird'),
    dgram = require('dgram'),
    debug = process.env.hasOwnProperty('MILIGHT_DEBUG') ? consoleDebug : function () {
    };

function consoleDebug() {
    console.log.apply(this, arguments)
}

module.exports = function (options) {
    var options = options || {};
    var port = options.port || 48899;
    var host = options.address || "255.255.255.255";
    var timeout = options.timeout || "3000";
    var discoveryMessage = Buffer([
        0x4C, 0x69, 0x6E, 0x6B,
        0x5F, 0x57, 0x69, 0x2D,
        0x46, 0x69
    ]);
    var timeoutId = null;
    var discoResults = [];

    return new Promise(function (resolve, reject) {
        var discoverer = dgram.createSocket('udp4');
        discoverer.bind();

        discoverer.on('listening', function () {
            discoverer.setBroadcast(true);

            discoverer.send(discoveryMessage, 0, discoveryMessage.length, port, host, function(error, bytes) {
                if (error) {
                    discoverer.emit('error', error);
                }
                else {
                    debug('UDP message sent to ' + host +':'+ port);
                }
            });

            timeoutId = setTimeout(function() {
                discoverer.close();
                resolve(discoResults);
            }, timeout)
        });

        discoverer.on('message', function (message, remote) {
            debug('UDP message received: ', message);
            var data = message.toString('ascii').split(/,|:/);
            debug('Data: ' + data.join(' | '));
            if (data.length >= 2) {
                discoResults.push({
                    ip: data[0],
                    mac: (data[1] || "").replace(/(.{2})/g,"$1:").slice(0,-1)
                });
            }
        });

        discoverer.on('error', function (error) {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }
            debug(error);
            reject(error);
        });
    });
};