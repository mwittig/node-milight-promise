# node-milight-promise

[![Build Status](https://travis-ci.org/mwittig/node-milight-promise.svg?branch=master)](https://travis-ci.org/mwittig/node-milight-promise)
[![Coverage Status](https://coveralls.io/repos/github/mwittig/node-milight-promise/badge.svg?branch=master)](https://coveralls.io/github/mwittig/node-milight-promise?branch=master)

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
 
## What's new: Bridge Discovery

The new bridge discovery function can be used to discover the IP and MAC addresses of Milight v4 Wifi bridges found 
on the local network. The following options can be provided to the discovery function.

| Property  | Default           | Type    | Description                                 |
|:----------|:------------------|:--------|:--------------------------------------------|
| address   | "255.255.255.255" | String  | The broadcast address                       |
| timeout   | 3000              | Integer | The timeout in milliseconds for discovery   |

An array of results is returned. Each result contains the following properties:
* ip: The IP address string
* max: The MAC address string

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

## Usage example for Discovery

    var discoverBridges = require('../src/index').discoverBridges;
    
    discoverBridges().then(function (results) {
        console.log(results);
    });
    
## Important Notes

* Instead of providing the global broadcast address which is the default, you should provide the IP address 
  of the Milight Controller for unicast mode. Don't use the global broadcast address on Windows as this may give
  unexpected results. On Windows, global broadcast packets will only be routed via the first network adapter. If
  you want to use a broadcast address though, use a network-specific address, e.g. for `192.168.0.1/24` use
  `192.168.0.255`.
* For White bulbs the property `commandRepeat` should be set to `1`, as the brightnessUp/brightnessDown, and
  warmer/cooler commands will perform multiple steps otherwise.
    
## History

See [Release History](https://github.com/mwittig/node-milight-promise/blob/master/HISTORY.md).

## License 

Copyright (c) 2015-2016, Marcus Wittig and contributors. All rights reserved.

[MIT License](https://github.com/mwittig/node-milight-promise/blob/master/LICENSE)