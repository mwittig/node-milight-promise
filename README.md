# node-milight-promise

A node module to control Milight LED bulbs and OEM equivalents auch as Rocket LED, Limitless LED Applamp, 
 Easybulb, s`luce, iLight, iBulb, and Kreuzer
 
NOTE: This is work in progress. 

## Usage Example

    var Milight = require('../src/index').MilightController;
    var commands = require('../src/index').commands;
    
    
    var light = new Milight({
            ip: "255.255.255.255"
        }),
        zone = 1;
    
    light.sendCommands(commands.rgbw.on(zone), commands.rgbw.brightness(100));
    for (var x=0; x<256; x++) {
        light.sendCommands( commands.rgbw.on(zone), commands.rgbw.hue(x));
    }
    light.pause(1000);
    light.sendCommands(commands.rgbw.on(zone), commands.rgbw.whiteMode(zone));
    
    light.close();