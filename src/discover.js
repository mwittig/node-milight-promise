var Promise = require('bluebird'),
    dgram = require('dgram'),
    helper = require('./helper');

module.exports = function (options) {
    var options = options || {};
    var port = options.port || 48899;
    var host = options.address || "255.255.255.255";
    var timeout = options.timeout || 3000;
    var discoverLegacy = !options.hasOwnProperty('type') || options.type == 'all' || options.type == 'legacy';
    var discoverV6 = options.type == 'all' || options.type == 'v6';
    var discoveryMessageLegacy = Buffer([
        0x4C, 0x69, 0x6E, 0x6B,
        0x5F, 0x57, 0x69, 0x2D,
        0x46, 0x69
    ]);
    var discoveryMessageV6 = Buffer([
        0x48, 0x46, 0x2D, 0x41,
        0x31, 0x31, 0x41, 0x53,
        0x53, 0x49, 0x53, 0x54,
        0x48, 0x52, 0x45, 0x41,
        0x44
    ]);
    var timeoutId = null;
    var discoResults = [];

    return new Promise(function (resolve, reject) {
        var discoverer = dgram.createSocket('udp4');
        discoverer.bind(function () {
            helper.debug("Milight: Discovery socket opened");
            discoverer.setBroadcast(true);
        });

        discoverer.on('listening', function () {
            try {
                if (typeof host !== "string") {
                    discoverer.emit('error', new TypeError("invalid arguments: IP address must be a string"));
                }
                else {
                  var discovererCB = function(error, bytes) {
                    if (error) {
                      discoverer.emit('error', error);
                    }
                    else {
                      helper.debug('UDP message sent to ' + host +':'+ port);

                      timeoutId = setTimeout(function() {
                        try {
                          discoverer.close();
                          helper.debug("Milight: Discovery socket closed");
                        } catch (ex) {/*ignore*/}
                        resolve(discoResults);
                      }, timeout)
                    }
                  };
                  if (discoverLegacy) {
                    discoverer.send(discoveryMessageLegacy, 0, discoveryMessageLegacy.length, port, host, discovererCB);
                  }
                  if (discoverV6) {
                    discoverer.send(discoveryMessageV6, 0, discoveryMessageV6.length, port, host, discovererCB);
                  }
                }
            }
            catch (e) {
                discoverer.emit('error', e);
            }
        });

        discoverer.on('message', function (message, remote) {
            helper.debug('UDP message received: ', message);
            var data = message.toString('ascii').split(/,|:/);
            helper.debug('Data: ' + data.join(' | '));
            if (data.length >= 2) {
                discoResults.push({
                    ip: data[0],
                    mac: (data[1] || "").replace(/(.{2})/g,"$1:").slice(0,-1),
                    name: data[2],
                    type: data[2] == ''?'legacy':'v6'
                });
            }
        });

        discoverer.on('error', function (error) {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }
            helper.debug(error);
            try {
                discoverer.close();
                helper.debug("Milight: Discovery socket closed");
            } catch (ex) {/*ignore*/}
            reject(error);
        });
    }.bind(this));
};