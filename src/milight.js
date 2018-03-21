var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Promise = require('bluebird');
var dgram = require('dgram');
var helper = require('./helper');
var milightLegacyMixin = require('./milight-legacy-mixin');
var milightV6Mixin = require('./milight-v6-mixin');

const v4Defaults = {
  ip: '255.255.255.255',
  port: 8899,
  delayBetweenCommands: 100,
  commandRepeat: 1,
  fullSync: true,
  type: 'v4',
  legacyErrorHandling: false
};
const v6Defaults = {
  ip: '255.255.255.255',
  port: 5987,
  delayBetweenCommands: 100,
  commandRepeat: 1,
  fullSync: true,
  sendKeepAlives: true,
  sessionTimeout: 30000,
  legacyErrorHandling: false
};

//
// Class MilightSynchronizationHandler
//

var MilightSynchronizationHandler= function () {
  this._lastRequest = Promise.resolve();
};

MilightSynchronizationHandler.prototype.settlePromise = function (func) {
  return this._lastRequest =  helper.settlePromise(this._lastRequest).then(func)
};

var _synchronize = new MilightSynchronizationHandler();


//
// Class MilightController
//

/**
 *
 * @param options
 * @constructor
 */
var MilightController = function (options) {
  var settings = options || {};

  if (settings.type === 'v6') {
    helper.assign(this, v6Defaults, settings);
    milightV6Mixin.call(this);
  }
  else {
    helper.assign(this, v4Defaults, settings);
    milightLegacyMixin.call(this);
  }
  if (typeof this.ip !== 'string') {
    throw new TypeError("property 'ip' must be a string")
  }
  this.broadcastMode = this.broadcastMode || this.ip.split('.').pop().trim() === '255';
  helper.debug(JSON.stringify(helper.assign({}, this)));
  this._socketInit = Promise.resolve();
  this._synchronize = this.fullSync ? _synchronize : new MilightSynchronizationHandler();
  this._sendRequest = Promise.resolve();
  this._initialized = new Promise(function (resolve, reject) {
    this._createSocket().bind(this).then(this._init).then(resolve).catch(reject)
  }.bind(this));

  EventEmitter.call(this)
};

util.inherits(MilightController, EventEmitter);

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
          if (self.broadcastMode) {
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

  return this._initialized.then(function () {
      return self._synchronize.settlePromise(function () {

        for (var i = 0; i < varArgs.length; i++) {
          if (! (varArgs[i] instanceof Array)) {
            return Promise.reject(new Error("Array arguments required"));
          }
          else {
            var arg = varArgs[i];
            if (((arg.length) > 0) && (arg[0] instanceof Array)) {
              for (var j = 0; j < arg.length; j++) {
                for (var r = 0; r < self.commandRepeat; r++) {
                  stackedCommands.push(self._sendByteArray(arg[j]));
                }
              }
            }
            else {
              for (var r = 0; r < self.commandRepeat; r++) {
                stackedCommands.push(self._sendByteArray(arg));
              }
            }
          }
        }
        return helper.settlePromises(stackedCommands)
    })
  }).catch(function (error) {
    this.emit("failed", error);
    if (! this.legacyErrorHandling) {
      return Promise.reject(error);
    }
    else {
      Promise.resolve()
    }
  }.bind(this))
};


/**
 *
 * @param ms
 * @returns {*}
 */
MilightController.prototype.pause = function (ms) {
  var self = this;
  ms = ms || 100;

  return this._initialized.then(function () {
    return self._synchronize.settlePromise(function () {
      return Promise.delay(ms).then(function() {
        helper.debug("paused for", ms, "ms")
      });
    })
  }).catch(function (error) {
    this.emit("failed", error);
    if (! this.legacyErrorHandling) {
      return Promise.reject(error);
    }
    else {
      Promise.resolve()
    }
  }.bind(this));
};


/**
 *
 * @returns {*}
 */
MilightController.prototype.close = function () {
  var self = this;

  return this._initialized.then(function () {
    return self._synchronize.settlePromise(function () {
      return self._close();
    })
  }).catch(function (error) {
    return self._close();
  }).finally(function () {
    if (self.clientSocket) {
      self.clientSocket.close();
      delete self.clientSocket;
      helper.debug("socket closed");
    }
  })
};

/**
 *
 * @returns {*}
 */
MilightController.prototype.ready = function () {
  return this._initialized
};

module.exports = MilightController;