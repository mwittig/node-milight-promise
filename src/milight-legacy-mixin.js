var Promise = require('bluebird');
var dgram = require('dgram');
var helper = require('./helper.js');


//
// Mixin for Milight Legacy Controllers
//

var milightLegacyMixin = function() {

  this._init = function () {
    return this._sendByteArray([]);
  };

  this._sendByteArray = function (byteArray) {
    if (! (byteArray instanceof Array)) {
      return Promise.reject(new Error("Array argument required"));
    }
    var buffer = new Buffer(byteArray),
      self = this;

    return self._sendRequest = helper.settlePromise(self._sendRequest).then(function () {

      return new Promise(function (resolve, reject) {
        self._createSocket().then(function () {
          self.clientSocket.send(buffer
            , 0
            , buffer.length
            , self.port
            , self.ip
            , function (err, bytes) {
              if (err) {
                helper.debug("UDP socket error:" + err);
                return reject(err);
              }
              else {
                helper.debug('bytesSent=' + bytes + ', buffer=[' + helper.buffer2hex(buffer) + ']');
                return Promise.delay(self.delayBetweenCommands).then(function () {
                  return resolve();
                });
              }
            }
          );
        }).catch(function (error) {
          return reject(error);
        })
      })
    })
  }.bind(this);

  this._close = function () {
    return Promise.resolve();
  };

  return this;
};



module.exports = milightLegacyMixin;