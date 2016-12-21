var Promise = require('bluebird');
var dgram = require('dgram');
var retry = require('promise-retryer')(Promise);
var helper = require('./helper.js');

//
// Local helper functions
//

function calcChecksum(bytes) {
  if (bytes.length >= 11) {
    // Calculate the modulo 256 checksum
    var sum = 0;
    for (var i = bytes.length - 11, l = bytes.length; i < l; i++) {
      sum += bytes[i];
    }

    // compliment
    bytes.push(sum & 0xFF);
  }
  return bytes
}

//
// Mixin for Milight Legacy Controllers
//


var milightV6Mixin = function() {

  this._init = function () {
    var self = this;
    self._sessionId = [0xFF, 0xFF];
    self._sequenceNumber = 4;
    self._awaitSessionInitialized = self._lastRequest;
    
    return self._lastRequest = helper.settlePromise(self._lastRequest).then(function () {

      return self._awaitSessionInitialized = new Promise(function (resolve, reject) {
        self._rpc([
          0x20, 0x00, 0x00, 0x00, 0x16, 0x02, 0x62, 0x3A,
          0xD5, 0xED, 0xA3, 0x01, 0xAE, 0x08, 0x2D, 0x46,
          0x61, 0x41, 0xA7, 0xF6, 0xDC, 0xAF, 0xD3, 0xE6,
          0x00, 0x00 //, 0x1E (use checksum instead)
        ]).then(function (response) {
          self._sessionId = response.slice(19, 21);
          helper.debug('Session Id: ' + helper.buffer2hex(self._sessionId));
          Promise.delay(self._delayBetweenCommands).then(function () {
            resolve(self._sessionId)
          })
        }).catch(function (error) {
          reject(error)
        })
      })
    })
  };

  this._sendByteArray = function (byteArray) {
    this._sequenceNumber=(this._sequenceNumber+1)%256;
    return this._rpc(
      [].concat(0x80, 0x00, 0x00, 0x00, 0x11, this._sessionId,
        0x00, this._sequenceNumber, 0x00, byteArray, 0x00));
  };

  this._rpc = function (byteArray) {
    return retry.run({
      maxRetries: 4,
      delay: 75,
      promise: function (attempt) {
        if (attempt > 1) {
          if (byteArray[0] === 0x80) {
            this._sequenceNumber=(this._sequenceNumber+1)%256;
            byteArray[8] = this._sequenceNumber;
            helper.debug("resending", attempt - 1);
          }
          byteArray.pop();
        }
        return this._rpcCallout(byteArray)
      }.bind(this)
    })
  };

  this._rpcCallout = function (byteArray) {
    if (! (byteArray instanceof Array)) {
      return Promise.reject(new Error("Array argument required"));
    }
    var buffer = new Buffer(calcChecksum(byteArray)),
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
                var timeoutId = setTimeout(function() {
                  self.clientSocket.removeAllListeners('message');
                  timeoutId = null;
                  helper.debug('no response timeout');
                  reject(new Error("no response timeout"))
                }, 250);
                var messageHandler = function (message, remote) {
                  if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                    self.remoteAddress = remote.address;
                    helper.debug('UDP message received: buffer=[' + helper.buffer2hex(message) + '], remote=' + remote.address);
                    Promise.delay(self._delayBetweenCommands).then(function () {
                      var result = [];
                      for (var i = 0; i < message.length; ++i) {
                        result.push(message[i]);
                      }
                      helper.debug('ready for next command');
                      return resolve(result);
                    });
                  }
                };
                self.clientSocket.once('message', messageHandler);
              }
            }
          );
        }).catch(function (error) {
          return reject(error);
        })
      })
    })
  };
  return this;
};

module.exports = milightV6Mixin;