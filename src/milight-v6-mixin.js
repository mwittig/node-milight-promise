var Promise = require('bluebird');
var dgram = require('dgram');
var retry = require('promise-retryer')(Promise);
var helper = require('./helper.js');
var keepAliveHeader = [0xD0, 0x00, 0x00, 0x00, 0x02];
//
// Local helper functions
//

function calcChecksum(bytes) {
  if (bytes.length >= 11) {
    // Calculate the modulo 256 checksum
    var sum = 0;
    for (var i = bytes.length - 11, l = bytes.length; i < l; i++) {
      sum += Number(bytes[i]);
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

  this._createSession = function() {
    var self = this;
    return self._synchronize.settlePromise(function () {

      return new Promise(function (resolve, reject) {
        self._rpc([
          0x20, 0x00, 0x00, 0x00, 0x16, 0x02, 0x62, 0x3A,
          0xD5, 0xED, 0xA3, 0x01, 0xAE, 0x08, 0x2D, 0x46,
          0x61, 0x41, 0xA7, 0xF6, 0xDC, 0xAF, 0xD3, 0xE6,
          0x00, 0x00
          // Instead of the 0x1E stop byte the checksum will be added instead which
          // will be appended as part of the _rpc() call. Apparently, the last
          // 5 bytes including the stop byte are not analyzed by the bridge controller
        ]).then(function (response) {
          self._sessionId = response.slice(19, 21);
          helper.debug('Session Id: ' + helper.buffer2hex(self._sessionId));
          return Promise.delay(self.delayBetweenCommands).then(function () {
            resolve(self._sessionId)
          })
        }).catch(function (error) {
          reject(error)
        })
      })
    })
  };

  this._cancelSessionUpdateTimer = function() {
    if (this._sessionTimeoutObject != null) {
      clearTimeout(this._sessionTimeoutObject);
      this._sessionTimeoutObject = null
    }
  };

  this._scheduleSessionUpdate = function() {
    this._cancelSessionUpdateTimer();

    this._sessionTimeoutObject = setTimeout(function() {
      this._createSession();
      this._scheduleSessionUpdate();
    }.bind(this), this.sessionTimeout);
  };

  this._sendByteArray = function (byteArray) {
    if (! (byteArray instanceof Array)) {
      return Promise.reject(new Error("Array argument required"));
    }
    this._sequenceNumber=(this._sequenceNumber+1)%256;
    return this._rpc(
      [].concat(0x80, 0x00, 0x00, 0x00, 0x11, this._sessionId,
        0x00, this._sequenceNumber, 0x00, byteArray, 0x00));
  }.bind(this);

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
        return this._rpcCall(byteArray)
      }.bind(this)
    })
  };

  this._rpcCall = function (byteArray) {
    var buffer = new Buffer(calcChecksum(byteArray)),
      self = this;

    return this._sendRequest = helper.settlePromise(this._sendRequest).then(function () {

      return new Promise(function (resolve, reject) {
        var timeoutId = null;

        self._createSocket().then(function () {
          self._lastBytesSent = byteArray;
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
                timeoutId = setTimeout(function() {
                  timeoutId = null;
                  self.clientSocket.removeListener('message', messageHandler);
                  helper.debug('no response timeout');
                  reject(new Error("no response timeout"))
                }, (byteArray[0] === 0x80)?250:1000);
                var messageHandler = function (message, remote) {
                  if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                    self.remoteAddress = remote.address;
                    helper.debug('bytesReceived=' + message.length + ', buffer=[' + helper.buffer2hex(message) + '], remote=' + remote.address);
                    Promise.delay(self.delayBetweenCommands).then(function () {
                      var result = Array.from(message);
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
          if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          return reject(error);
        })
      })
    })
  };

  this._init = function () {
    this._sessionId = [0xFF, 0xFF];
    this._sequenceNumber = 4;
    this._sessionTimeoutObject = null;
    return new Promise(function (resolve, reject) {
      helper.debug("Establishing new session");
      this._createSession()
        .then(function () {
          helper.debug("Session initialized");
          this._scheduleSessionUpdate();
          resolve();
        }.bind(this))
        .catch(function (error) {
          helper.debug("Session failed:", error);
          reject(error);
        })
    }.bind(this));
  };

  this._close = function () {
    this._cancelSessionUpdateTimer();
    return Promise.resolve();
  };

  return this;
};

module.exports = milightV6Mixin;