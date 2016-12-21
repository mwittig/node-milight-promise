var Promise = require('bluebird');
var dgram = require('dgram');
var helper = require('./helper');
var milightLegacyMixin = require('./milight-legacy-mixin');
var milightV6Mixin = require('./milight-v6-mixin');

const
    DEFAULT_IP = '255.255.255.255',
    DEFAULT_PORT = 8899,
    DEFAULT_PORT_V6 = 5987,
    DEFAULT_COMMAND_DELAY = 100,
    DEFAULT_COMMAND_REPEAT = 1;

//
// Class MilightController
//

/**
 *
 * @param options
 * @constructor
 */
var MilightController = function (options) {
    options = options || {};

    this.type = options.type;
    this.ip = options.ip || DEFAULT_IP;
    if (this.type === 'v6') {
        milightV6Mixin.call(this);
        this.port = options.port || DEFAULT_PORT_V6;
    }
    else {
        milightLegacyMixin.call(this);
        this.port = options.port || DEFAULT_PORT;
    }
    this._delayBetweenCommands = options.delayBetweenCommands || DEFAULT_COMMAND_DELAY;
    this._broadcastMode = options.broadcastMode || this.ip.split('.').pop().trim() === '255';
    this._commandRepeat = options.commandRepeat || DEFAULT_COMMAND_REPEAT;
    this._socketInit = Promise.resolve();
    this._lastRequest = this._createSocket();
    this._sendRequest = Promise.resolve();
    helper.debug(JSON.stringify({
        ip: this.ip,
        port: this.port,
        delayBetweenCommands: this._delayBetweenCommands,
        commandRepeat: this._commandRepeat
    }));
    this._init();
};

//
// Private member functions
//

MilightController.prototype._createSocket = function () {
    var self = this;

    return helper.settlePromise(self._socketInit).then(function () {

        return self._socketInit = new Promise(function (resolve, reject) {
            if (self.clientSocket) {
                return resolve();
            }
            else {
                helper.debug("initializing socket");
                var socket = dgram.createSocket('udp4');

                socket.bind(function () {
                    self.clientSocket = socket;
                    if (self._broadcastMode) {
                        socket.setBroadcast(true);
                        helper.debug("initializing socket (broadcast mode) done");
                    }
                    else {
                        helper.debug("initializing socket done");
                    }
                    return resolve();
                })
            }
        });
    });
};


//
// Public member functions
//

/**
 *
 * @param varArgArray
 * @returns {*}
 */
MilightController.prototype.sendCommands = function (varArgArray) {
    var stackedCommands = [],
        varArgs = arguments,
        self = this;

    return self._lastRequest = helper.settlePromise(self._lastRequest).then(function () {

        for (var i = 0; i < varArgs.length; i++) {
            if (! (varArgs[i] instanceof Array)) {
                return Promise.reject(new Error("Array arguments required"));
            }
            else {
                var arg = varArgs[i];
                if (((arg.length) > 0) && (arg[0] instanceof Array)) {
                    for (var j = 0; j < arg.length; j++) {
                        for (var r = 0; r < self._commandRepeat; r++) {
                            stackedCommands.push(self._sendByteArray(arg[j]));
                        }
                    }
                }
                else {
                    for (var r = 0; r < self._commandRepeat; r++) {
                        stackedCommands.push(self._sendByteArray(arg));
                    }
                }
            }
        }
        return helper.settlePromises(stackedCommands)
    });
};


/**
 *
 * @param ms
 * @returns {*}
 */
MilightController.prototype.pause = function (ms) {
    var self = this;
    ms = ms || 100;

    return self._lastRequest = helper.settlePromise(self._lastRequest).then(function () {
        return Promise.delay(ms).then(function() {
            helper.debug("paused for", ms, "ms")
        });
    })
};


/**
 *
 * @returns {*}
 */
MilightController.prototype.close = function () {
    var self = this;

    return self._lastRequest = helper.settlePromise(self._lastRequest).then(function () {
        if (self.clientSocket) {
            self.clientSocket.close();
            delete self.clientSocket;
            helper.debug("socket closed");
        }
        return Promise.resolve();
    })
};


module.exports = MilightController;