var dgram = require('dgram');
var Promise = require('bluebird');
var _ = require('lodash');
var Milight = require('../src/milight');
var commands = require('../src/commands');
var index = require('../src/index');

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

        server.on('message', function (msg, rinfo) {
            //console.log('server got:', JSON.stringify(msg));
            for (var x = 0; x < msg.length; x++) {
                bytesReceived.push(msg[x]);
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
        server.close();
    });

    it("shall receive no command on pause", function (done) {
        light.pause(1000)
            .then(function () {
                expect(bytesReceived.length).toBe(0);
            })
            .finally(function () {
                done();
            });
    });

    it("shall provide module exports", function (done) {
        expect(index.MilightController).toBeDefined();
        expect(index.commands).toBeDefined();
        done();
    });

    it("shall receive the command rgbw on", function (done) {
        var command = commands.rgbw.on(1);
        light.sendCommands(command)
            .then(function () {
                expect(bytesReceived.length).toBe(command.length);
                expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(command))
            })
            .finally(function () {
                done();
            });
    });

    it("shall receive the command rgbw off", function (done) {
        var command = commands.rgbw.off(1);
        light.sendCommands(command)
            .then(function () {
                expect(bytesReceived.length).toBe(command.length);
                expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(command))
            })
            .finally(function () {
                done();
            });
    });

    it("shall receive the command rgbw brightness", function (done) {
        var command = commands.rgbw.brightness(100);
        light.sendCommands(command)
            .then(function () {
                expect(bytesReceived.length).toBe(command.length);
                expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(command))
            })
            .finally(function () {
                done();
            });
    });

    it("shall receive the command rgbw hue", function (done) {
        var command = commands.rgbw.hue(50);
        light.sendCommands(command)
            .then(function () {
                expect(bytesReceived.length).toBe(command.length);
                expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(command))
            })
            .finally(function () {
                done();
            });
    });

    it("shall receive the command rgbw rbg color", function (done) {
        var command = _.flattenDeep(commands.rgbw.rgb255(10, 50, 100));
        light.sendCommands(command)
            .then(function () {
                expect(bytesReceived.length).toBe(command.length);
                expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(command))
            })
            .finally(function () {
                done();
            });
    });

    it("shall receive the command white on", function (done) {
        var command = commands.white.on(1);
        light.sendCommands(command)
            .then(function () {
                expect(bytesReceived.length).toBe(command.length);
                expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(command))
            })
            .finally(function () {
                done();
            });
    });

    it("shall receive the command white off", function (done) {
        var command = commands.white.off(1);
        light.sendCommands(command)
            .then(function () {
                expect(bytesReceived.length).toBe(command.length);
                expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(command))
            })
            .finally(function () {
                done();
            });
    });

    it("shall receive the command white maximum brightness", function (done) {
        var command = commands.white.maxBright(1);
        light.sendCommands(command)
            .then(function () {
                expect(bytesReceived.length).toBe(command.length);
                expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(command))
            })
            .finally(function () {
                done();
            });
    });

    it("shall receive the command white night mode", function (done) {
        var command = commands.white.nightMode(1);
        light.sendCommands(command)
            .then(function () {
                expect(bytesReceived.length).toBe(command.length);
                expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(command))
            })
            .finally(function () {
                done();
            });
    });

    it("shall receive the command white warmer", function (done) {
        var command = commands.white.warmer();
        light.sendCommands(command)
            .then(function () {
                expect(bytesReceived.length).toBe(command.length);
                expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(command))
            })
            .finally(function () {
                done();
            });
    });

    it("shall receive the command white cooler", function (done) {
        var command = commands.white.cooler();
        light.sendCommands(command)
            .then(function () {
                expect(bytesReceived.length).toBe(command.length);
                expect(JSON.stringify(bytesReceived)).toEqual(JSON.stringify(command))
            })
            .finally(function () {
                done();
            });
    });
});