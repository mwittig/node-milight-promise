var dgram = require('dgram');
var Promise = require('bluebird');
var flattenDeep = require('lodash.flattendeep');
var Milight = require('../src/milight');
var commands = require('../src/commandsV6');
var index = require('../src/index');
var discoverBridges = require('../src/index').discoverBridges;

const PORT = 5987;
var bytesSent = [];
var bytesReceived = [];
var server, light;


describe("Testing transmission of control sequences", function () {
  var priorTestPromise = Promise.resolve();

  beforeAll(function (done) {
    server = dgram.createSocket('udp4');

    server.on('error', function (err) {
      console.log('server error:' + err.stack);
      server.close();
    });

    server.on('message', function (msg, remote) {
      if (msg[0] !== 0x20) {
        for (var x = 0; x < msg.length; x++) {
          bytesReceived.push(msg[x]);
        }
      }
      if (msg.toString() === Buffer([
          0x48, 0x46, 0x2D, 0x41,
          0x31, 0x31, 0x41, 0x53,
          0x53, 0x49, 0x53, 0x54,
          0x48, 0x52, 0x45, 0x41,
          0x44
        ]).toString()) {
        var message = new Buffer("10.10.10.10,AABBCCDDEEFF");
        server.send(message, 0, message.length, remote.port, remote.address);
      }
      else if (msg[0] === 0x80) {
        var message = new Buffer([0x88,0x00,0x00,0x00,0x03,0x00,0x07,0x00]);
        server.send(message, 0, message.length, remote.port, remote.address);
      }
      else if (msg[0] === 0x20) {
        var message = new Buffer([
          0x28,0x00,0x00,0x00,0x11,0x00,0x02,0xF0,
          0xFE,0x6B,0x16,0xB1,0x50,0x50,0xAA,0x4F,
          0x76,0x00,0x01,0xED,0x01,0x00
        ]);
        server.send(message, 0, message.length, remote.port, remote.address);
      }
    });

    function serverBind() {
      return new Promise(function (resolve, reject) {
        server.once('listening', function () {
          resolve();
        });
        server.bind(PORT);
      })
    }

    serverBind().then(function () {
      light = new Milight({
        ip: "localhost",
        type: 'v6'
      });
      return new Promise(done);
    });
  });

  beforeEach(function (done) {
    bytesSent = [];
    bytesReceived = [];
    priorTestPromise.then(function () {

      /* Test setup must go in promise chain */

      return new Promise(done);
    });
  });

  afterAll(function () {
    light.close();
    try {
      server.close();
    } catch(e) {/*ignore*/}
  });

  it("shall fail if no array passed _sendByteArray", function (done) {
    light._sendByteArray(1)
      .then(function() {
        expect(true).toBeFalsy();
      })
      .catch(function (error) {
        expect(true).toBeTruthy();
      })
      .finally(function () {
        done();
      });
  });

  it("shall fail if no array passed to sendCommands", function (done) {
    light.sendCommands(1)
      .then(function() {
        expect(true).toBeFalsy();
      })
      .catch(function (error) {
        expect(true).toBeTruthy();
      })
      .finally(function () {
        done();
      });
  });

  it("shall provide module exports", function (done) {
    expect(index.MilightController).toBeDefined();
    expect(index.discoverBridges).toBeDefined();
    expect(index.commands).toBeDefined();
    done();
  });

  it("shall receive the command rgbw on in broadcast mode", function (done) {
    var myLight = new Milight({
      type: 'v6'
    });
    var calls = [
      commands.rgbw.on(1),
    ];
    var test = function(total, command) {
      return myLight.sendCommands(command)
        .then(function () {
          expect(bytesReceived.length).toBe(myLight._lastBytesSent.length);
          expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(myLight._lastBytesSent));
          bytesReceived = [];
          total += bytesReceived.length
        });
    };
    myLight._initialized.then(function() {
      Promise.reduce(
        calls, test, 0
      ).finally(function () {
        myLight.close();
        done();
      })
    });
  });

  it("shall receive the command rgbw brightness", function (done) {
    var calls = [
      commands.rgbw.brightness(1, 100)
    ];
    var test = function(total, command) {
      return light.sendCommands(command)
        .then(function () {
          expect(bytesReceived.length).toBe(light._lastBytesSent.length);
          expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(light._lastBytesSent));
          bytesReceived = [];
          total += bytesReceived.length
        });
    };
    Promise.reduce(
      calls, test, 0
    ).finally(function () {
      done();
    })
  });

  it("shall receive the command rgbw hue", function (done) {
    var calls = [
      [1, 5],
      [1, 50]
    ];
    var test = function(total, args) {
      var innerCalls = [
        commands.rgbw.hue.apply(commands.rgbw, args)
      ];
      var innerTest = function(total, command) {
        return light.sendCommands(command)
          .then(function () {
            expect(bytesReceived.length).toBe(light._lastBytesSent.length);
            expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(light._lastBytesSent));
            bytesReceived = [];
            total += bytesReceived.length
          })
      };
      return Promise.reduce(
        innerCalls, innerTest, 0
      )
    };
    Promise.reduce(
      calls, test, 0
    ).finally(function () {
      done();
    })
  });

  it("shall receive the command rgbw rgb color", function (done) {
    var calls = [
      [1, 255, 255, 255],
      [1, 0, 0, 0],
      [1, 255, 100, 0],
      [1, 255, 0, 100],
      [1, 0, 255, 100],
      [1, 0, 100, 255]
    ];
    var test = function(total, args) {
      var innerCalls = [
        flattenDeep(commands.rgbw.rgb255.apply(commands.rgbw, args)),
        flattenDeep(commands.rgbw.rgb.apply(commands.rgbw, args))
      ];
      var innerTest = function(total, command) {
        return light.sendCommands(command)
          .then(function () {
            expect(bytesReceived.length).toBe(light._lastBytesSent.length);
            expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(light._lastBytesSent));
            bytesReceived = [];
            total += bytesReceived.length
          })
      };
      return Promise.reduce(
        innerCalls, innerTest, 0
      )
    };
    Promise.reduce(
      calls, test, 0
    ).finally(function () {
      done();
    })
  });

  //it("shall receive the rgbw command", function (done) {
  //    var test = function(total, commandName) {
  //        var innerCalls = [
  //            commands.rgbw[commandName](1)
  //        ];
  //        var innerTest = function(total, command) {
  //            return light.sendCommands(command)
  //                .then(function () {
  //                    expect(bytesReceived.length).toBe(command.length);
  //                    expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(command));
  //                    bytesReceived = [];
  //                    total += bytesReceived.length
  //                })
  //        };
  //        return Promise.reduce(
  //            innerCalls, innerTest, 0
  //        )
  //    };
  //    Promise.reduce(
  //        ["allOn", "allOff", "effectModeNext", "effectSpeedUp", "effectSpeedDown"], test, 0
  //    ).finally(function () {
  //        done();
  //    })
  //});

  it("shall receive the white command on zone 1", function (done) {
    var test = function(total, commandName) {
      var innerCalls = [
        commands.white[commandName](1)
      ];
      var innerTest = function(total, command) {
        return light.sendCommands(command)
          .then(function () {
            expect(bytesReceived.length).toBe(light._lastBytesSent.length);
            expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(light._lastBytesSent));
            bytesReceived = [];
            total += bytesReceived.length
          })
      };
      return Promise.reduce(
        innerCalls, innerTest, 0
      )
    };
    Promise.reduce(
      ["nightMode", "maxBright", "on", "off"], test, 0
    ).finally(function () {
      done();
    })
  });

  it("shall receive the white command", function (done) {
    var test = function(total, commandName) {
      var innerCalls = [
        commands.white[commandName](1)
      ];
      var innerTest = function(total, command) {
        return light.sendCommands(command)
          .then(function () {
            expect(bytesReceived.length).toBe(light._lastBytesSent.length);
            expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(light._lastBytesSent));
            bytesReceived = [];
            total += bytesReceived.length
          })
      };
      return Promise.reduce(
        innerCalls, innerTest, 0
      )
    };
    Promise.reduce(
      [/*"allOn", "allOff",*/ "warmer", "cooler", "brightUp", "brightDown"], test, 0
    ).finally(function () {
      done();
    })
  });

  it("shall invoke the discovery function without options", function (done) {
    discoverBridges({type: 'v6'}).then(function (results) {
        expect(results.length).toBeGreaterThan(-1);
      })
      .finally(function () {
        done();
      });
  });

  it("shall invoke the discovery function with a specific address and port", function (done) {
    discoverBridges({address: "10.10.10.10", port: 4711, type: 'v6'}).then(function (results) {
        expect(results.length).toBe(0);
      })
      .finally(function () {
        done();
      });
  });

  it("shall invoke the discovery function with a shorter timeout", function (done) {
    discoverBridges({timeout: 1000, type: 'v6'}).then(function (results) {
        expect(results.length).toBeGreaterThan(-1);
      })
      .finally(function () {
        done();
      });
  });

  it("shall invoke the discovery function with an invalid address", function (done) {
    discoverBridges({address: 1, type: 'v6'}).then(function (results) {
        expect(true).toBeFalsy();
      })
      .catch(function (error) {
        expect(true).toBeTruthy();
      })
      .finally(function () {
        done();
      });
  });

  it("shall invoke the discovery function and get a result", function (done) {
    discoverBridges({address: "localhost", port: PORT, type: 'v6'}).then(function (results) {
        expect(results.length).toBe(1);
      })
      .catch(function (error) {
        expect(true).toBeTruthy();
      })
      .finally(function () {
        done();
      });
  });
});