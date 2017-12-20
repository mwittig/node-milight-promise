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
  var sendResponse = true;

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
      if (sendResponse) {
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
        else if (msg[0] === 0xFF) {
          var message = new Buffer([
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF
          ]);
          server.send(message, 0, message.length, remote.port, remote.address);
          sendResponse = false;
        }
      }
      else {
        sendResponse = true;
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

  it("shall shall timeout if no response from server", function (done) {
    light._rpc([0x00, 0xFF, 0x00])
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
    expect(index.commandsV6).toBeDefined();
    expect(index.helper).toBeDefined();
    done();
  });

  it("shall provide bulb command objects", function (done) {
    expect(index.commandsV6.bridge).toBeDefined();
    expect(index.commandsV6.rgbw).toBeDefined();
    expect(index.commandsV6.white).toBeDefined();
    expect(index.commandsV6.fullColor).toBeDefined();
    expect(index.commandsV6.fullColor8Zone).toBeDefined();
    expect(index.commandsV6.rgb).toBeDefined();
    done();
  });

  it("shall handle debug message at runtime", function (done) {
    try {
      if (process.env.hasOwnProperty('MILIGHT_DEBUG')) {
        var debug = process.env.MILIGHT_DEBUG;
        delete process.env.MILIGHT_DEBUG;
        delete require.cache[require.resolve('../src/helper')];
        require('../src/helper').debug();
        process.env.MILIGHT_DEBUG = debug;
      }
      else {
        process.env.MILIGHT_DEBUG = "";
        delete require.cache[require.resolve('../src/helper')];
        require('../src/helper').debug();
        delete process.env.MILIGHT_DEBUG;
      }
      expect(true).toBeTruthy();
    }
    catch (e) {
      console.log(e)
      expect(e instanceof TypeError).toBeTruthy();
    }
    done();
  });

  it("shall throw TypeError if assign is called with undefined target", function (done) {
    try {
      index.helper.assign();
      expect(true).toBeFalsy();
    }
    catch (e) {
      expect(e instanceof TypeError).toBeTruthy();
    }
    done();
  });

  it("shall shall silently skip if assign is called with undefined source", function (done) {
    var a = {};
    index.helper.assign(a, {a: 1}, undefined, {b: 1})
    expect(a.a === 1 && a.b === 1).toBeTruthy();
    done();
  });

  it("shall transform HEX to RGB", function (done) {
    expect(index.helper.hexToRgb('#007aff')).toEqual({r: 0, g: 122, b:255});
    done();    
  });

  it("shall transform HSV hue to milight hue", function (done) {
    expect(index.helper.hsvToMilightColor([359, 0, 0])).toBe(178);
    done();
  });

  it("shall transform RGB to milight hue", function (done) {
    expect(index.helper.rgbToHue.apply(index.helper, [255, 0, 0])).toBe(0xB0);
    done();
  });

  it("shall transform RGB to Milight full color HSV", function (done) {
    expect(index.helper.rgbToFullColorHsv.apply(index.helper, [255, 0, 0])[0]).toBe(0xB0);
    done();
  });

  it("shall transform RGB to Milight full color HSV", function (done) {
    expect(index.helper.rgbToFullColorHsv.apply(index.helper, [0, 255, 255])[0]).toBe(0x133);
    done();
  });

  it("shall retry if no response", function (done) {
    var myLight = new Milight({
      type: 'v6'
    });
    var calls = [
      [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF],
      commands.rgbw.on(1)
    ];
    var test = function(total, command) {
      expect(command).toBeDefined();
      return myLight.sendCommands(command)
        .then(function () {
          expect(bytesReceived.length).toBe(myLight._lastBytesSent.length);
          expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(myLight._lastBytesSent));
          bytesReceived = [];
          total += bytesReceived.length
        });
    };
    myLight.ready().then(function() {
      Promise.reduce(
        calls, test, 0
      ).catch(function (error) {
        console.log(error);
        expect(true).toBe(false)
      }).finally(function () {
        myLight.close();
        done();
      })
    });
  });

  it("shall reject initialization if address is invalid", function (done) {

    var myLight = new Milight({
      type: 'v6',
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
    var myLight = new Milight({
      type: 'v6',
      fullSync: false
    });
    var calls = [
      commands.rgbw.on(1),
    ];
    var test = function(total, command) {
      expect(command).toBeDefined();
      return myLight.sendCommands(command)
        .then(function () {
          expect(bytesReceived.length).toBe(myLight._lastBytesSent.length);
          expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(myLight._lastBytesSent));
          bytesReceived = [];
          total += bytesReceived.length
        });
    };
    myLight.ready().then(function() {
      Promise.reduce(
        calls, test, 0
      ).catch(function (error) {
        console.log(error);
        expect(true).toBe(false)
      }).finally(function () {
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
      expect(command).toBeDefined();
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
    ).catch(function (error) {
      console.log(error);
      expect(true).toBe(false)
    }).finally(function () {
      done();
    })
  });

  it("shall receive the command rgbw hue", function (done) {
    var calls = [
      [1, 5],
      [1, 50],
      [1, 255],
      [1, 5, true],
      [1, 50, true],
      [1, 255, true]
    ];
    var test = function(total, args) {
      var innerCalls = [
        commands.rgbw.hue.apply(commands.rgbw, args)
      ];
      var innerTest = function(total, command) {
        expect(command).toBeDefined();
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
    ).catch(function (error) {
      console.log(error);
      expect(true).toBe(false)
    }).finally(function () {
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
        expect(command).toBeDefined();
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
        commands.rgbw[commandName](1)
      ];
      var innerTest = function(total, command) {
        expect(command).toBeDefined();
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
      ["nightMode", "whiteMode", "on", "off"], test, 0
    ).catch(function (error) {
      console.log(error);
      expect(true).toBe(false)
    }).finally(function () {
      done();
    })
  });

  it("shall receive the command rgbw effectMode", function (done) {
    var calls = [
      [1, 1],
      [1, 5],
      [1, 9]
    ];
    var test = function(total, args) {
      var innerCalls = [
        commands.rgbw.effectMode.apply(commands.rgbw, args)
      ];
      var innerTest = function(total, command) {
        expect(command).toBeDefined();
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
              commands.rgbw[commandName](1)
          ];
          var innerTest = function(total, command) {
              expect(command).toBeDefined();
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
          [/*"allOn", "allOff",*/
            "effectModeNext", "effectModeNext", "effectModeNext", "effectModeNext", "effectModeNext",
            "effectModeNext", "effectModeNext", "effectModeNext", "effectModeNext", "effectModeNext",
            "effectModeNext", "effectSpeedUp", "effectSpeedDown", "link", "unlink"
          ], test, 0
      ).catch(function (error) {
        console.log(error);
        expect(true).toBe(false)
      }).finally(function () {
          done();
      })
  });

  //
  // Bridge LED commands
  //

  it("shall receive the command bridge brightness", function (done) {
    var calls = [
      commands.bridge.brightness(100)
    ];
    var test = function(total, command) {
      expect(command).toBeDefined();
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
    ).catch(function (error) {
      console.log(error);
      expect(true).toBe(false)
    }).finally(function () {
      done();
    })
  });

  it("shall receive the command bridge hue", function (done) {
    var calls = [
      [5],
      [50],
      [255, true],
      [50, true],
      [255, true]
    ];
    var test = function(total, args) {
      var innerCalls = [
        commands.bridge.hue.apply(commands.bridge, args)
      ];
      var innerTest = function(total, command) {
        expect(command).toBeDefined();
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
    ).catch(function (error) {
      console.log(error);
      expect(true).toBe(false)
    }).finally(function () {
      done();
    })
  });

  it("shall receive the command bridge rgb color", function (done) {
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
        flattenDeep(commands.bridge.rgb.apply(commands.bridge, args))
      ];
      var innerTest = function(total, command) {
        expect(command).toBeDefined();
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
    ).catch(function (error) {
      console.log(error);
      expect(true).toBe(false)
    }).finally(function () {
      done();
    })
  });

  it("shall receive the bridge command", function (done) {
    var test = function(total, commandName) {
      var innerCalls = [
        commands.bridge[commandName].call(commands.bridge)
      ];
      var innerTest = function(total, command) {
        expect(command).toBeDefined();
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
      [
        "on", "off", "nightMode", "whiteMode",
        "effectModeNext", "effectModeNext", "effectModeNext", "effectModeNext", "effectModeNext",
        "effectModeNext", "effectModeNext", "effectModeNext", "effectModeNext", "effectModeNext",
        "effectModeNext", "effectSpeedUp", "effectSpeedDown"
      ], test, 0
    ).catch(function (error) {
      console.log(error);
      expect(true).toBe(false)
    }).finally(function () {
      done();
    })
  });

  it("shall receive the command bridge effectMode", function (done) {
    var calls = [
      [1],
      [5],
      [9]
    ];
    var test = function(total, args) {
      var innerCalls = [
        commands.bridge.effectMode.apply(commands.bridge, args)
      ];
      var innerTest = function(total, command) {
        expect(command).toBeDefined();
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
    ).catch(function (error) {
      console.log(error);
      expect(true).toBe(false)
    }).finally(function () {
      done();
    })
  });

  //
  // RGBWW/CW commands

  it("shall receive the command rgbww/cw brightness", function (done) {
    var calls = [
      commands.fullColor.brightness(1, 100)
    ];
    var test = function(total, command) {
      expect(command).toBeDefined();
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
    ).catch(function (error) {
      console.log(error);
      expect(true).toBe(false)
    }).finally(function () {
      done();
    })
  });

  it("shall receive the command rgbww/cw hue", function (done) {
    var calls = [
      [1, 5],
      [1, 50],
      [1, 255],
      [1, 5, true],
      [1, 50, true],
      [1, 255, true]
    ];
    var test = function(total, args) {
      var innerCalls = [
        commands.fullColor.hue.apply(commands.fullColor, args)
      ];
      var innerTest = function(total, command) {
        expect(command).toBeDefined();
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
    ).catch(function (error) {
      console.log(error);
      expect(true).toBe(false)
    }).finally(function () {
      done();
    })
  });

  it("shall receive the command rgbww/cw saturation", function (done) {
    var calls = [
      [1, 1],
      [1, 50],
      [1, 100]
    ];
    var test = function(total, args) {
      var innerCalls = [
        commands.fullColor.saturation.apply(commands.fullColor, args)
      ];
      var innerTest = function(total, command) {
        expect(command).toBeDefined();
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
    ).catch(function (error) {
      console.log(error);
      expect(true).toBe(false)
    }).finally(function () {
      done();
    })
  });

  it("shall receive the command rgbww/cw rgb color", function (done) {
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
        commands.fullColor.rgb.apply(commands.fullColor, args)
      ];
      var innerTest = function(total, command) {
        expect(command).toBeDefined();
        return Promise.each(command, function(c) {
          bytesReceived = [];
          return light.sendCommands(c)
            .then(function () {
              expect(bytesReceived.length).toBe(light._lastBytesSent.length);
              expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(light._lastBytesSent));
              bytesReceived = [];
              total += bytesReceived.length
            })
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

  it("shall receive the rgbww/cw command on zone 1", function (done) {
    var test = function(total, commandName) {
      var innerCalls = [
        commands.fullColor[commandName](1)
      ];
      var innerTest = function(total, command) {
        expect(command).toBeDefined();
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
      ["nightMode", "whiteMode", "on", "off"], test, 0
    ).catch(function (error) {
      console.log(error);
      expect(true).toBe(false)
    }).finally(function () {
      done();
    })
  });

  it("shall receive the command rgbww/cw whiteTemperature", function (done) {
    var calls = [
      [1, 1],
      [1, 50],
      [1, 100]
    ];
    var test = function(total, args) {
      var innerCalls = [
        commands.fullColor.whiteTemperature.apply(commands.fullColor, args)
      ];
      var innerTest = function(total, command) {
        expect(command).toBeDefined();
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
    ).catch(function (error) {
      console.log(error);
      expect(true).toBe(false)
    }).finally(function () {
      done();
    })
  });

  it("shall receive the command rgbww/cw effectMode", function (done) {
    var calls = [
      [1, 1],
      [1, 5],
      [1, 9]
    ];
    var test = function(total, args) {
      var innerCalls = [
        commands.fullColor.effectMode.apply(commands.fullColor, args)
      ];
      var innerTest = function(total, command) {
        expect(command).toBeDefined();
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
    ).catch(function (error) {
      console.log(error);
      expect(true).toBe(false)
    }).finally(function () {
      done();
    })
  });

  it("shall receive the rgbww/cw command", function (done) {
    var test = function(total, commandName) {
      var innerCalls = [
        commands.fullColor[commandName](1)
      ];
      var innerTest = function(total, command) {
        expect(command).toBeDefined();
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
      [/*"allOn", "allOff",*/
        "effectModeNext", "effectModeNext", "effectModeNext", "effectModeNext", "effectModeNext",
        "effectModeNext", "effectModeNext", "effectModeNext", "effectModeNext", "effectModeNext",
        "effectModeNext", "effectSpeedUp", "effectSpeedDown", "link", "unlink"
      ], test, 0
    ).catch(function (error) {
      console.log(error);
      expect(true).toBe(false)
    }).finally(function () {
      done();
    })
  });

  //
  // 8-zone RGB+CCT commands
  //


  it("shall receive the command8-zone rgbww/cw brightness", function (done) {
    var calls = [
      commands.fullColor8Zone.brightness(1, 100)
    ];
    var test = function(total, command) {
      expect(command).toBeDefined();
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
    ).catch(function (error) {
      console.log(error);
      expect(true).toBe(false)
    }).finally(function () {
      done();
    })
  });

  it("shall receive the command8-zone rgbww/cw hue", function (done) {
    var calls = [
      [1, 5],
      [1, 50],
      [1, 255],
      [1, 5, true],
      [1, 50, true],
      [1, 255, true]
    ];
    var test = function(total, args) {
      var innerCalls = [
        commands.fullColor8Zone.hue.apply(commands.fullColor8Zone, args)
      ];
      var innerTest = function(total, command) {
        expect(command).toBeDefined();
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
    ).catch(function (error) {
      console.log(error);
      expect(true).toBe(false)
    }).finally(function () {
      done();
    })
  });

  it("shall receive the command8-zone rgbww/cw saturation", function (done) {
    var calls = [
      [1, 1],
      [1, 50],
      [1, 100]
    ];
    var test = function(total, args) {
      var innerCalls = [
        commands.fullColor8Zone.saturation.apply(commands.fullColor8Zone, args)
      ];
      var innerTest = function(total, command) {
        expect(command).toBeDefined();
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
    ).catch(function (error) {
      console.log(error);
      expect(true).toBe(false)
    }).finally(function () {
      done();
    })
  });

  it("shall receive the command8-zone rgbww/cw rgb color", function (done) {
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
        commands.fullColor8Zone.rgb.apply(commands.fullColor8Zone, args)
      ];
      var innerTest = function(total, command) {
        expect(command).toBeDefined();
        return Promise.each(command, function(c) {
          bytesReceived = [];
          return light.sendCommands(c)
            .then(function () {
              expect(bytesReceived.length).toBe(light._lastBytesSent.length);
              expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(light._lastBytesSent));
              bytesReceived = [];
              total += bytesReceived.length
            })
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

  it("shall receive the8-zone rgbww/cw command on zone 1", function (done) {
    var test = function(total, commandName) {
      var innerCalls = [
        commands.fullColor8Zone[commandName](1)
      ];
      var innerTest = function(total, command) {
        expect(command).toBeDefined();
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
      ["nightMode", "whiteMode", "on", "off"], test, 0
    ).catch(function (error) {
      console.log(error);
      expect(true).toBe(false)
    }).finally(function () {
      done();
    })
  });

  it("shall receive the command8-zone rgbww/cw whiteTemperature", function (done) {
    var calls = [
      [1, 1],
      [1, 50],
      [1, 100]
    ];
    var test = function(total, args) {
      var innerCalls = [
        commands.fullColor8Zone.whiteTemperature.apply(commands.fullColor8Zone, args)
      ];
      var innerTest = function(total, command) {
        expect(command).toBeDefined();
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
    ).catch(function (error) {
      console.log(error);
      expect(true).toBe(false)
    }).finally(function () {
      done();
    })
  });

  it("shall receive the command8-zone rgbww/cw effectMode", function (done) {
    var calls = [
      [1, 1],
      [1, 5],
      [1, 9]
    ];
    var test = function(total, args) {
      var innerCalls = [
        commands.fullColor8Zone.effectMode.apply(commands.fullColor8Zone, args)
      ];
      var innerTest = function(total, command) {
        expect(command).toBeDefined();
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
    ).catch(function (error) {
      console.log(error);
      expect(true).toBe(false)
    }).finally(function () {
      done();
    })
  });

  it("shall receive the8-zone rgbww/cw command", function (done) {
    var test = function(total, commandName) {
      var innerCalls = [
        commands.fullColor8Zone[commandName](1)
      ];
      var innerTest = function(total, command) {
        expect(command).toBeDefined();
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
      [/*"allOn", "allOff",*/
        "effectModeNext", "effectModeNext", "effectModeNext", "effectModeNext", "effectModeNext",
        "effectModeNext", "effectModeNext", "effectModeNext", "effectModeNext", "effectModeNext",
        "effectModeNext", "effectSpeedUp", "effectSpeedDown", "link", "unlink"
      ], test, 0
    ).catch(function (error) {
      console.log(error);
      expect(true).toBe(false)
    }).finally(function () {
      done();
    })
  });

  //
  // WW/CW commands
  //

  it("shall receive the white command on zone 1", function (done) {
    var test = function(total, commandName) {
      var innerCalls = [
        commands.white[commandName](1)
      ];
      var innerTest = function(total, command) {
        expect(command).toBeDefined();
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
        commands.white[commandName](1)
      ];
      var innerTest = function(total, command) {
        expect(command).toBeDefined();
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
      [/*"allOn", "allOff",*/
        "warmer", "cooler", "brightUp", "brightDown", "link", "unlink"
      ], test, 0
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
        commands.rgb[commandName](1)
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
      [
        "on", "off", "effectModeUp", "effectModeDown",
        "effectModeNext", "effectModeNext", "effectModeNext", "effectModeNext", "effectModeNext",
        "effectModeNext", "effectModeNext", "effectModeNext", "effectModeNext", "effectModeNext",
        "effectModeNext", "effectSpeedUp", "effectSpeedDown", "brightUp", "brightDown", "link", "unlink"
      ], test, 0
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
      [50],
      [255, true]
    ];
    var test = function(total, args) {
      var innerCalls = [
        commands.rgb.hue.apply(commands.rgb, args)
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
    ).catch(function (error) {
      console.log(error);
      expect(true).toBe(false)
    }).finally(function () {
      done();
    })
  });

  it("shall receive the command rgb bulb rgb color", function (done) {
    var calls = [
      [255, 255, 255],
      [0, 0, 0],
      [255, 100, 0],
      [255, 0, 100],
      [0, 255, 100],
      [0, 100, 255]
    ];
    try {
      var test = function (total, args) {
        var innerCalls = [
          commands.rgb.rgb.apply(commands.rgb, args),
          commands.rgb.rgb255.apply(commands.rgb, args)
        ];
        var innerTest = function(total, command) {
          expect(command).toBeDefined();
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
    } catch (e) { console.log(e.stack())}
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
    discoverBridges({type: 'v6'}).then(function (results) {
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

  it("shall invoke the discovery function with a specific address and port", function (done) {
    discoverBridges({address: "10.10.10.10", port: 4711, type: 'v6'}).then(function (results) {
      expect(results.length).toBe(0);
    })
    .catch(function (error) {
      console.log(error);
      expect(true).toBe(false)
    }).finally(function () {
      done();
    });
  });

  it("shall return discovery with an error if address is set to an invalid value", function (done) {
    discoverBridges({address: 1, port: 4711, type: 'v6'}).then(function (results) {
      expect(true).toBeFalsy();
    })
    .catch(function (error) {
      expect(error instanceof TypeError).toBeTruthy();
    })
    .finally(function () {
      done();
    });
  });

  it("shall invoke the discovery function with a shorter timeout", function (done) {
    discoverBridges({timeout: 1000, type: 'v6'}).then(function (results) {
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

  it("shall return discovery with an error if address is set to an invalid value", function (done) {
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
