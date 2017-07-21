var dgram = require('dgram');
var Promise = require('bluebird');
var flattenDeep = require('lodash.flattendeep');
var Milight = require('../src/milight');
var commands = require('../src/commands');
var commands2 = require('../src/commands2');
var index = require('../src/index');
var discoverBridges = require('../src/index').discoverBridges;

const PORT = 8899;
var bytesReceived = [];
var server, light;


describe("Testing transmission of control sequences", function () {

    beforeAll(function (done) {
        server = dgram.createSocket('udp4');

        server.on('error', function (err) {
            console.log('server error:' + err.stack);
            server.close();
        });

        server.on('message', function (msg, remote) {
            //console.log('server got:', JSON.stringify(msg));
            for (var x = 0; x < msg.length; x++) {
                bytesReceived.push(msg[x]);
            }
            if (msg.toString() === Buffer([0x4C, 0x69, 0x6E, 0x6B, 0x5F, 0x57, 0x69, 0x2D, 0x46, 0x69]).toString()) {
                var message = new Buffer("10.10.10.10,AABBCCDDEEFF");
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
                delayBetweenCommands: 50,
                commandRepeat: 1
            });
            done();
        });
    });

    beforeEach(function () {
        bytesReceived = []
    });

    afterAll(function () {
        light.close();
        try {
            server.close();
        } catch(e) {/*ignore*/}
    });

    it("shall receive no command on pause without value", function (done) {
        light.pause()
            .then(function () {
                expect(bytesReceived.length).toBe(0);
            })
            .finally(function () {
                done();
            });
    });

    it("shall receive no command on pause with value", function (done) {
        light.pause(1000)
            .then(function () {
                expect(bytesReceived.length).toBe(0);
            })
            .finally(function () {
                done();
            });
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
        expect(index.commands2).toBeDefined();
        done();
    });

    it("shall reject initialization if address is invalid", function (done) {
      var myLight = new Milight({
        ip: "1"
      });
      myLight.ready()
        .then(function () {
          expect(true).toBeFalsy();
        })
        .catch(function (error) {
          expect(true).toBeTruthy();
        })
        .finally(function () {
          myLight.close();
          done();
        })
    }, 15000);

    it("shall receive the command rgbw on in broadcast mode", function (done) {
        var myLight = new Milight();
        var calls = [
            commands.rgbw.on(1),
            commands2.rgbw.on(1)
        ];
        var test = function(total, command) {
            return myLight.sendCommands(command)
                .then(function () {
                    expect(bytesReceived.length).toBe(command.length);
                    expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(command));
                    bytesReceived = [];
                    total += bytesReceived.length
                });
        };
        Promise.reduce(
            calls, test, 0
        ).finally(function () {
            myLight.close();
            done();
        })
    });

  it("shall ignore double close", function (done) {
    var myLight = new Milight();
    var calls = [
      commands.rgbw.on(1)
    ];
    var test = function(total, command) {
      return myLight.sendCommands(command)
        .then(function () {
          expect(bytesReceived.length).toBe(command.length);
          expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(command));
          bytesReceived = [];
          total += bytesReceived.length
        });
    };
    Promise.reduce(
      calls, test, 0
    ).finally(function () {
      myLight.close();
      myLight.close();
      done();
    })
  });

    it("shall receive the command rgbw brightness", function (done) {
        var calls = [
            commands.rgbw.brightness(100),
            commands2.rgbw.brightness(100),
            commands.rgbw.brightness2(100),
            commands2.rgbw.brightness2(100)
        ];
        var test = function(total, command) {
            return light.sendCommands(command)
                .then(function () {
                    expect(bytesReceived.length).toBe(command.length);
                    expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(command));
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
            [5],
            [50]
        ];
        var test = function(total, args) {
            var innerCalls = [
                commands.rgbw.hue.apply(commands.rgbw, args),
                commands2.rgbw.hue.apply(commands2.rgbw, args)
            ];
            var innerTest = function(total, command) {
                return light.sendCommands(command)
                    .then(function () {
                        expect(bytesReceived.length).toBe(command.length);
                        expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(command));
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
        ).catch(function (error) {
          console.log(error);
          expect(true).toBe(false)
        }).finally(function () {
            done();
        })
    });

    it("shall send a stacked command", function (done) {
        var calls = [
            commands.rgbw.rgb255(255, 255, 255),
            commands2.rgbw.rgb255(255, 255, 255),
            commands.rgbw.rgb(255, 255, 255),
            commands2.rgbw.rgb(255, 255, 255)
        ];
        var test = function(total, command) {
            return light.sendCommands(command)
                .then(function () {
                    expect(bytesReceived.length).toBe(flattenDeep(command).length);
                    expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(flattenDeep(command)));
                    bytesReceived = [];
                    total += bytesReceived.length
                });
        };
        Promise.reduce(
            calls, test, 0
        ).catch(function (error) {
          console.log(error);
          expect(true).toBe(false)
        }).finally(function () {
            done();
        })
    });

    it("shall receive the command rgbw rgb color", function (done) {
        var calls = [
            [255, 255, 255],
            [0, 0, 0],
            [255, 100, 0],
            [255, 0, 100],
            [0, 255, 100],
            [0, 100, 255]
        ];
        var test = function(total, args) {
            var innerCalls = [
                flattenDeep(commands.rgbw.rgb255.apply(commands.rgbw, args)),
                flattenDeep(commands2.rgbw.rgb255.apply(commands2.rgbw, args))
            ];
            var innerTest = function(total, command) {
                return light.sendCommands(command)
                    .then(function () {
                        expect(bytesReceived.length).toBe(command.length);
                        expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(command));
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
        ).catch(function (error) {
          console.log(error);
          expect(true).toBe(false)
        }).finally(function () {
            done();
        })
    });

    it("shall receive the rgbw command on zone 1", function (done) {
        var test = function(total, commandName) {
            var innerCalls = [
                commands.rgbw[commandName](1),
                commands2.rgbw[commandName](1)
            ];
            var innerTest = function(total, command) {
                return light.sendCommands(command)
                    .then(function () {
                        expect(bytesReceived.length).toBe(command.length);
                        expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(command));
                        bytesReceived = [];
                        total += bytesReceived.length
                    })
            };
            return Promise.reduce(
                innerCalls, innerTest, 0
            )
        };
        Promise.reduce(
            ["nightMode", "whiteMode", "on", "off"], test, 0
        ).catch(function (error) {
          console.log(error);
          expect(true).toBe(false)
        }).finally(function () {
            done();
        })
    });

    it("shall receive the rgbw command", function (done) {
        var test = function(total, commandName) {
            var innerCalls = [
                commands.rgbw[commandName](),
                commands2.rgbw[commandName]()
            ];
            var innerTest = function(total, command) {
                return light.sendCommands(command)
                    .then(function () {
                        expect(bytesReceived.length).toBe(command.length);
                        expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(command));
                        bytesReceived = [];
                        total += bytesReceived.length
                    })
            };
            return Promise.reduce(
                innerCalls, innerTest, 0
            )
        };
        Promise.reduce(
            ["allOn", "allOff", "effectModeNext", "effectSpeedUp", "effectSpeedDown"], test, 0
        ).catch(function (error) {
          console.log(error);
          expect(true).toBe(false)
        }).finally(function () {
            done();
        })
    });

    it("shall receive the white command on zone 1", function (done) {
        var test = function(total, commandName) {
            var innerCalls = [
                commands.white[commandName](1),
                commands2.white[commandName](1)
            ];
            var innerTest = function(total, command) {
                return light.sendCommands(command)
                    .then(function () {
                        expect(bytesReceived.length).toBe(command.length);
                        expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(command));
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
        ).catch(function (error) {
          console.log(error);
          expect(true).toBe(false)
        }).finally(function () {
            done();
        })
    });

    it("shall receive the white command", function (done) {
        var test = function(total, commandName) {
            var innerCalls = [
                commands.white[commandName](),
                commands2.white[commandName]()
            ];
            var innerTest = function(total, command) {
                return light.sendCommands(command)
                    .then(function () {
                        expect(bytesReceived.length).toBe(command.length);
                        expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(command));
                        bytesReceived = [];
                        total += bytesReceived.length
                    })
            };
            return Promise.reduce(
                innerCalls, innerTest, 0
            )
        };
        Promise.reduce(
            ["allOn", "allOff", "warmer", "cooler", "brightUp", "brightDown"], test, 0
        ).catch(function (error) {
          console.log(error);
          expect(true).toBe(false)
        }).finally(function () {
            done();
        })
    });

    it("shall receive the rgb command", function (done) {
        var test = function(total, commandName) {
            var innerCalls = [
                commands.rgb[commandName](),
                commands2.rgb[commandName]()
            ];
            var innerTest = function(total, command) {
                return light.sendCommands(command)
                    .then(function () {
                        expect(bytesReceived.length).toBe(command.length);
                        expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(command));
                        bytesReceived = [];
                        total += bytesReceived.length
                    })
            };
            return Promise.reduce(
                innerCalls, innerTest, 0
            )
        };
        Promise.reduce(
            ["on", "off", "speedUp", "speedDown", "effectSpeedUp",
                "effectSpeedDown", "brightUp", "brightDown"], test, 0
        ).catch(function (error) {
          console.log(error);
          expect(true).toBe(false)
        }).finally(function () {
            done();
        })
    });

    it("shall receive the command rgb hue", function (done) {
        var calls = [
            [5],
            [50]
        ];
        var test = function(total, args) {
            var innerCalls = [
                commands.rgb.hue.apply(commands.rgb, args),
                commands2.rgb.hue.apply(commands.rgb, args)
            ];
            var innerTest = function(total, command) {
                return light.sendCommands(command)
                    .then(function () {
                        expect(bytesReceived.length).toBe(command.length);
                        expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(command));
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
        ).catch(function (error) {
          console.log(error);
          expect(true).toBe(false)
        }).finally(function () {
            done();
        })
    });

    it("shall invoke the discovery function without options", function (done) {
        discoverBridges().then(function (results) {
            expect(results.length).toBeGreaterThan(-1);
        })
        .finally(function () {
            done();
        });
    });

    it("shall invoke the discovery function with a specific address and port", function (done) {
        discoverBridges({address: "10.10.10.10", port: 4711}).then(function (results) {
            expect(results.length).toBe(0);
        })
        .finally(function () {
            done();
        });
    });

    it("shall return discovery with an error if address is set to an invalid value", function (done) {
        discoverBridges({address: 1, port: 4711}).then(function (results) {
          expect(true).toBeFalsy();
        })
        .catch(function (error) {
          expect(error instanceof TypeError).toBeTruthy();
        })
        .finally(function () {
            done();
        });
    });

  it("shall invoke the discovery function with an invalid address", function (done) {
    discoverBridges({address: "1", type: 'v6'}).then(function (results) {
      expect(true).toBeFalsy();
    })
      .catch(function (error) {
        expect(true).toBeTruthy();
      })
      .finally(function () {
        done();
      });
  });

    it("shall invoke the discovery function with a shorter timeout", function (done) {
        discoverBridges({timeout: 1000}).then(function (results) {
                expect(results.length).toBeGreaterThan(-1);
            })
            .catch(function (error) {
              console.log(error);
              expect(true).toBe(false)
            })
            .finally(function () {
                done();
            });
    });

    it("shall invoke the discovery function with an invalid address", function (done) {
        discoverBridges({address: 1}).then(function (results) {
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
        discoverBridges({address: "localhost", port: PORT}).then(function (results) {
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