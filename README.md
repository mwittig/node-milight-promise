# node-milight-promise

A node module to control Milight LED bulbs and OEM equivalents auch as Rocket LED, Limitless LED Applamp, 
 Easybulb, s`luce, iLight, iBulb, and Kreuzer. This library use Promises to automatically synchronize the command 
 sequences. So there is no need for nesting commands using callback. Of course, each API call returns a promise which
 can be used to wait for the call to be resolved or rejected.

## Introduction

Milight uses a very primitive three-byte-sequence one-way communication proptocol where each command must be sent in a 
 single UDP packet. It is fire & forget really similar to simply RF protocols fro garage door openers and such.
 Compared to other Milight libraries I am using a more more aggressive timing for the delay between sending UDP command 
 packets (```delayBetweenCommands``` property). 
 Generally, the delay is to reduce the chances of UDP package loss on the network. A longer delay may lower the risk of 
 data loss, however, data loss is likely to occur occasionally on a wireless network. Keep in mind, that apart from your 
 Wifi network there is another lossy communications channel between the Milight Controller and the bulbs. My strategy 
 against loss is to repeat each command send three times (```commandRepeat``` property). 

## Usage Example

    var Milight = require('../src/index').MilightController;
    var commands = require('../src/index').commands;
    
    
    var light = new Milight({
            ip: "255.255.255.255",
            delayBetweenCommands: 35,
            commandRepeat: 3
        }),
        zone = 1;
    
    light.sendCommands(commands.rgbw.on(zone), commands.rgbw.brightness(100));
    for (var x=0; x<256; x++) {
        light.sendCommands( commands.rgbw.on(zone), commands.rgbw.hue(x));
    }
    light.pause(1000);
    light.sendCommands(commands.rgbw.on(zone), commands.rgbw.whiteMode(zone));
    
    light.close();
    
Instead of providing the broadcast IP address which is the default, you should provide the IP address 
 of the Milight Controller for unicast mode.
    
## History

* 20150426, V0.0.1
    * Initial Version

* 20150510, V0.0.2
    * Improved and simplified synchronization of command sequences
    * Added repeat mode to send each sequences multiple times
* 20150901, V0.0.3
    * Corrected commands, added RGBW night mode, and cleanup - big thanks to @dotsam for his contribution!
    * Revised license information to provide a SPDX 2.0 license identifier according to npm v2.1 guidelines 
      on license metadata - see also https://github.com/npm/npm/releases/tag/v2.10.0
