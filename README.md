# node-milight-promise

[![Build Status](https://travis-ci.org/mwittig/node-milight-promise.svg?branch=master)](https://travis-ci.org/mwittig/node-milight-promise)

A node module to control Milight LED bulbs and OEM equivalents such as Rocket LED, Limitless LED Applamp, 
 Easybulb, s`luce, iLight, iBulb, and Kreuzer. This library uses Promises to automatically synchronize the command 
 sequences. Thus, there is no need for nesting commands using callbacks. Of course, each API call returns a promise 
 which can be used to wait for the call to be resolved or rejected. The module has been tested with RGBW and White 
 bulbs using a Milight version 4 bridge. RGB bulbs which are no longer sold since January 2014 should also work using
 the rgb command set.

## Introduction

Milight uses a very primitive three-byte-sequence one-way communication protocol where each command must be sent in a 
 single UDP packet. It is just fire & forget similar to simple RF protocols for garage door openers and such.
 Compared to other Milight libraries, I am using a more aggressive timing for the delay between sending UDP command 
 packets (```delayBetweenCommands``` property). 
 
 Generally, the delay is to reduce the chances of UDP packet loss on the network. A longer delay may lower the risk of 
 data loss, however, data loss is likely to occur occasionally on a wireless network. Keep in mind, that apart from your 
 Wifi network there is another lossy communications channel between the Milight Controller and the bulbs. My strategy 
 against loss is to repeat each command. By default it will be send three times (```commandRepeat``` property). 
 
## What's new

As Promise.settle() has been deprecated I have rolled my own method based Promised.reflect(). I have also started to 
write some tests and to provide for test and build automation (for node 0.10.x and 4.x). Test 
coverage isn't great, but I'll continue to work on this in the future.

## Usage Example

See also example code provided in the `examples` directory of the package.

    var Milight = require('../src/index').MilightController;
    var commands = require('../src/index').commands;
    
    var light = new Milight({
            ip: "255.255.255.255",
            delayBetweenCommands: 50,
            commandRepeat: 2
        }),
        zone = 1;
    
    light.sendCommands(commands.rgbw.on(zone), commands.rgbw.brightness(100), commands.rgbw.whiteMode(zone));
    light.pause(1000);
    
    for (var x = 100; x >= 0; x -= 5) {
        light.sendCommands(commands.rgbw.brightness(x));
        light.pause(100);
    }
    light.pause(1000);
    
    light.sendCommands(commands.rgbw.on(zone), commands.rgbw.whiteMode(zone));
    light.pause(1000);

    light.sendCommands(commands.rgbw.off(zone));
    light.close();

## Important Notes

* Instead of providing the global broadcast address which is the default, you should provide the IP address 
  of the Milight Controller for unicast mode. Don't use the global broadcast address on Windows as this may give
  unexpected results. On Windows, global broadcast packets will only be routed via the first network adapter. If
  you want to use a broadcast address though, use a network-specific address, e.g. for `192.168.0.1/24` use
  `192.168.0.255`.
* For White bulbs the property `commandRepeat` should be set to `1`, as the brightnessUp/brightnessDown, and
  warmer/cooler commands will perform multiple steps otherwise.
    
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
* 20151219, V0.0.4
    * New example code for RGBW and WW/CW bulbs
    * Revised README
* 20160305, V0.0.5
    * Replaced deprecated use of Promise.settle()
    * Added baseline for automated builds and tests (travis, istanbul, coveralls)
    * Added some tests cases
