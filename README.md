# node-milight-promise

[![Greenkeeper badge](https://badges.greenkeeper.io/mwittig/node-milight-promise.svg)](https://greenkeeper.io/)
[![Npm Version](https://badge.fury.io/js/node-milight-promise.svg)](http://badge.fury.io/js/node-milight-promise)
[![Build Status](https://travis-ci.org/mwittig/node-milight-promise.svg?branch=master)](https://travis-ci.org/mwittig/node-milight-promise)
[![Dependency Status](https://david-dm.org/mwittig/node-milight-promise.svg)](https://david-dm.org/mwittig/node-milight-promise)
[![Coverage Status](https://coveralls.io/repos/github/mwittig/node-milight-promise/badge.svg?branch=master)](https://coveralls.io/github/mwittig/node-milight-promise?branch=master)

A node module to control Milight LED bulbs and OEM equivalents such as Rocket LED, Limitless LED Applamp, 
 Easybulb, s`luce, iLight, iBulb, and Kreuzer. This library uses Promises to automatically synchronize the command 
 sequences sent. Thus, there is no need for nesting commands using callbacks. Of course, each API call returns a promise 
 which can be used to wait for the call promise to be resolved or rejected. The module has been tested with 
 RGB WW/CW (full color), RGBWW and White bulbs using Milight protocol versions 4.0 and 6.0. RGB bulbs which are no 
 longer sold since January 2014 should also work using the rgb command set.
 
Earlier versions of Milight used a very primitive one-way communication protocol where each command must be sent in a 
 single UDP packet. It is just fire & forget similar to simple RF protocols for garage door openers and such. Recently, 
 a new generation of Milight products has been introduced which use a new v6.0 protocol to provide advanced features. 

## Contributions

Contributions to the project are  welcome. You can simply fork the project and create a pull request with 
your contribution to start with. If you like this plugin, please consider &#x2605; starring 
[the project on github](https://github.com/mwittig/node-milight-promise).
 
### What's new / Version 0.3.x: Breaking and Notable Changes

Support for using the 8-zone controller with CCT bulbs has been added (thanks to @pauleec & @fghekman for testing). 
 The 8-zone controller is known to work with current makes of the iBox2 bridge. Presumably, it will also work 
 with newer makes of iBox1. It did not work with mine, however, which is a couple of months old. Note, it is not 
 possible to pair a CCT bulb with the 4-zone and the 8-zone controller at the same time. As some users reported the 
 control session becomes invalid with their iBox2 bridge after a few minutes the session timeout has been reduced 
 to 30 seconds and it is now configurable also.

### Version 0.2.x: Breaking and Notable Changes

So far, synchronization of Milight commands had been performed for each Milight() instance, individually. This caused 
 problems with some applications, which create multiple Milight() instances, for example, to manage different zones. 
 In some cases, commands did not get sent in the expected order or commands event got dropped by Milight Controller. 
 The current version should solve these issues by synchronizing commands across all instances. This also lays the 
 ground for a higher layer command API I am planning to add in the future.
 
If the new synchronization feature causes unexpected behavior it can be switched off as part of the configuration 
 options for a milight instance (`fullSync: false`).
 
### Version 0.1.x: Breaking and Notable Changes

This version includes support for the new WiFi Bridge protocol v6.0 (also referred to as "v6 bridge" by the 
 project). Applications using the legacy should not be impacted, however I had to remove some supporting functions 
 to reduce code duplication (see Breaking Changes below).

Support for the v6 bridge includes the following features:

* support for the new full color RGW WW/CW bulbs
* support for legacy bulbs WW/CW white bulbs, RGBWW bulbs and RGB(W) strip controllers
* optional support for the legacy Milight color wheel
* flow control with automatic retry
* control for multiple bridges
* bridge discovery
* support for unicast and broadcast communication
* link/unlink bulbs to/from a given zone

The old command interface should work as is with the following exception:

* the command function `rgbToHsv()` and `hsvToMilightColor()` have ben removed to reduce the amount of code duplication. 
  If you use this function in your code you can now find the code in `helper.js` which is also exported using the 
  `helper` property.
  
There are also some subtle, notable changes of the default behaviour:

* the default for `commandRepeat` has been changed to `1` to provide consistent operation for all modes (WW/CW bulbs 
  with legacy bridges in particular). Note, beyond, a higher value does not make much sense for the v6 bridge 
  as the flow control strategy will automatically resend messages as required (if no receipt received)
  
* the default for `delayBetweenCommands` has been changed to `100` ms to provide consistent operation for all modes. 
  According to my findings a more aggressive timing is possible with the legacy bridges depending on condition of the 
  LAN (quality of the wireless link and router physics).  

## Notable features for v6 Bridge

### Flow Control

The new bridge allows for the implementation of flow control as each command message received by the bridge is replied 
with a receipt message. So far, I have implemented a very simple strategy which is to wait for the receipt 

### Color Model

To my surprise, the color model of the v6.0 bridge protocol is different to the color wheel supported by earlier 
 bridge versions for RGBW lights. If you look at the old color wheel the new color wheel runs counterclockwise 
 and it is shifted by about 22.5 degrees to the left. It still looks odd to me as it does not match with RGB 
 wheel or the HSV color circle. Another curiosity is the color wheel of the bridge light is different to the 
 one of the RGBW light as it is shifted by another 22.5 degrees (starting with red instead of violet). 
 Maybe this is a bug of the bridge firmware or it is a calibration issue?

To cut a long story short I have integrated an optional transformation feature to the hue command for bridge and rgbw 
 to optionally support the legacy color wheel. This might be useful for applications which provide controls
 for the legacy color wheel like the plugin for pimatic does.
 
### Pairing - Link/Unlink Bulbs

According to my findings a bulb can only be linked to single zone of a v6.0 bridge. The link/unlink commands can be used 
 for pairing within a short time window of about five seconds after powering up the bulb. If a bulb has not been paired
 yet, calling the on() command a few times after powering up the bulb will also link the bulb to the given zone. 
 
The following visual feedback is provided when pairing full color RGB bulbs:
 * Flashing red light: The unlink command has been received. Flashing will stop after five seconds.
 * Flashing green light: The link command has been received and pairing is in progress. Pairing mode will stop 
   after 5 seconds and light will turn to red.
 * Constant red light: The bulb is either not linked to a bridge or it has been linked to a zone, but no further command
   has been received yet.

### Effect Mode

Using the effect mode (1 to 9) will not turn on the device. Thus, make sure the device is on before setting the 
 effect mode. To disable the effect mode you can set the white mode or choose a color. Note, switching off will not 
 disable the effect mode.

## Notable features for Legacy Bridges

### Delay and and Command Repeat

Generally, the delay between commands is required to reduce the chances of UDP packet loss on the network. A longer 
 delay may lower the risk of data loss, however, data loss is likely to occur occasionally on a wireless network. Keep 
 in mind, that apart from your Wifi network there is another lossy communications channel between the Milight 
 Controller and the bulbs. Another strategy against loss is to repeat each command.  By default, each command 
 will only be sent once. If you wish to resend commands you set number of repeats using the ```commandRepeat``` 
 property. Keep in mind, however, this should not be used with white bulbs, as the brightnessUp/brightnessDown, and
 warmer/cooler commands will perform multiple steps otherwise.

### Brightness

I noticed the `rgbw.brightness()` command never reached the maximum brightness level of the bulb and it turned out to be
yet another bug in the `commands` file. I also found an article suggesting the RGBW bulbs support 22 brightness levels 
instead of 20, however, the two additional levels did not change the brightness for me (tested with 6W bulbs). Maybe 
this is different with 9W bulbs. For this reason, I have added `rgbw.brightness2()` which maps brightness 0-100 to 
22 levels.

Another interesting observation is the RGBW bulbs keep brightness levels for color mode and white mode, individually.
Thus, you may notice a change in brightness if you switch to white mode, for example. So, if your application only
maintains a single brightness control you need to make sure to send the commands in the right order!

### Rendering RGB colors

For RGBW bulbs the command `rgbw.rgb255` is provided to map RGB values to Milight. However, the
color space of Milight is limited, as it is not possible to control color saturation and there are only 20 
brightness levels. Thus, the results may be disappointing when compared to other LED lightning technologies.
Effectively, Milight is unable to display different shades of grey.
  
### 2-byte Command Sequences

Recently, I found out that Milight bridge version 3 and higher can also handle 2-byte command sequences instead of
3-byte command sequence. Basically, the last byte of the 3-byte command sequence, call it stop byte, can be omitted. 
It is said the 2-byte command sequences provide better performance. This may be true for the Milight RF protocol, 
but I don't think it has an significant impact on the IP communication between the application and the bridge. To use 
the 2-byte command sequences you can simply use `commands2` instead of `commands`. Mixing 2-byte and 3-byte sequences 
is also supported.

## General Features

### Bridge Discovery

The bridge discovery function can be used to discover the IP and MAC addresses of Milight Wifi bridges found 
on the local network. By default, the discovery function will only discover legacy bridges using the V3/V4/V5 protocol.
By setting the "type" property to the value "v6" the new bridges can be discovered. Using value "all" all bridges can be 
discovered.

The following options can be provided to the discovery function.

| Property  | Default           | Type    | Description                                 |
|:----------|:------------------|:--------|:--------------------------------------------|
| address   | "255.255.255.255" | String  | The broadcast address. See "Important Notes" below.  |
| timeout   | 3000              | Integer | The timeout in milliseconds for discovery   |
| type      | "legacy"          | String  | One of "legacy", "v6", or "all" to determine the types of bridges to discover |

An array of results is returned. Each result contains the following properties:
* ip: The IP address string
* mac: The MAC address string
* type: The type of bridge. One of "legacy" or "v6"
* name: The hostname of the bridge. This will be empty for legacy bridges.

## Usage

Documentation is still something left to be desired and I am sorry for that. To bridge the gap I have written some 
example applications which you can find in the `examples` directory of the project/package.

### Usage Example for Legacy Bridge

```javascript
var Milight = require('node-milight-promise').MilightController;
var commands = require('node-milight-promise').commands2;

// Important Notes:
// Instead of providing the global broadcast address which is the default, you should provide the IP address
// of the Milight Controller for unicast mode. Don't use the global broadcast address on Windows as this may give
// unexpected results. On Windows, global broadcast packets will only be routed via the first network adapter. If
// you want to use a broadcast address though, use a network-specific address, e.g. for `192.168.0.1/24` use
// `192.168.0.255`.

var light = new Milight({
		ip: "255.255.255.255",
		delayBetweenCommands: 75,
		commandRepeat: 2
	}),
	zone = 1;

light.sendCommands(commands.rgbw.on(zone), commands.rgbw.whiteMode(zone), commands.rgbw.brightness(100));
light.pause(1000);

light.sendCommands(commands.rgbw.off(zone));
light.pause(1000);

// Setting Hue
light.sendCommands(commands.rgbw.on(zone));
for (var x = 0; x < 256; x += 5) {
	light.sendCommands(commands.rgbw.hue(x));
	if (x === 0) {
		commands.rgbw.brightness(100)
	}
	light.pause(100);
}
light.pause(1000);

light.sendCommands(commands.rgbw.off(zone));
light.pause(1000);

// Back to white mode
light.sendCommands(commands.rgbw.on(zone), commands.rgbw.whiteMode(zone));
light.pause(1000);

// Setting Brightness
light.sendCommands(commands.rgbw.on(zone));
for (var x = 100; x >= 0; x -= 5) {
	light.sendCommands(commands.rgbw.brightness(x));
	light.pause(100);
}
light.pause(1000);

light.sendCommands(commands.rgbw.off(zone));
light.pause(1000);

light.close().then(function () {
	console.log("All command have been executed - closing Milight");
});
console.log("Invocation of asynchronous Milight commands done");
```

### Usage Example for v6 Bridge

```javascript
var Milight = require('../src/index').MilightController;
var commands = require('../src/index').commandsV6;

// Important Notes:
// *  Instead of providing the global broadcast address which is the default, you should provide the IP address
//    of the Milight Controller for unicast mode. Don't use the global broadcast address on Windows as this may give
//    unexpected results. On Windows, global broadcast packets will only be routed via the first network adapter. If
//    you want to use a broadcast address though, use a network-specific address, e.g. for `192.168.0.1/24` use
//    `192.168.0.255`.
// *  Note, for the v6 command set each command must be provided with a zone parameter as shown in the example below!

var light = new Milight({
    ip: "255.255.255.255",
    type: 'v6'
  }),
  zone = 1;

light.sendCommands(commands.rgbw.on(zone), commands.rgbw.whiteMode(zone), commands.rgbw.brightness(zone, 100));
light.pause(1000);

light.sendCommands(commands.rgbw.off(zone));
light.pause(1000);

// Setting Hue
light.sendCommands(commands.rgbw.on(zone));
light.pause(1000);

for (var x = 0; x < 256; x += 5) {
  light.sendCommands(commands.rgbw.hue(zone, x));
  if (x === 0) {
    light.sendCommands(commands.rgbw.brightness(zone, 100))
  }
}
light.pause(1000);

light.sendCommands(commands.rgbw.off(zone));
light.pause(1000);

// Back to white mode
light.sendCommands(commands.rgbw.on(zone), commands.rgbw.whiteMode(zone));
light.pause(1000);

// Setting Brightness
light.sendCommands(commands.rgbw.on(zone));
for (var x = 100; x >= 0; x -= 5) {
  light.sendCommands(commands.rgbw.brightness(zone, x));
}
light.pause(1000);

light.sendCommands(commands.rgbw.off(zone));
light.pause(1000);

light.close().then(function () {
  console.log("All command have been executed - closing Milight");
});
console.log("Invocation of asynchronous Milight commands done");
```

### Usage example for Discovery - Legacy bridges, only

```javascript
var discoverBridges = require('../src/index').discoverBridges;

discoverBridges().then(function (results) {
	console.log(results);
});
```

### Usage example for Discovery - All bridges

```javascript
var discoverBridges = require('../src/index').discoverBridges;

discoverBridges({
    type: 'all'
}).then(function (results) {
	console.log(results);
});
```
    
## Important Notes

* Instead of providing the global broadcast address which is the default, you should provide the IP address 
  of the Milight Controller for unicast mode. Don't use the global broadcast address on Windows as this may give
  unexpected results. On Windows, global broadcast packets will only be routed via the first network adapter. If
  you want to use a broadcast address though, use a network-specific address, e.g. for `192.168.0.1/24` use
  `192.168.0.255`.

* For White bulbs the property `commandRepeat` should be set to `1`, as the brightnessUp/brightnessDown, and
  warmer/cooler commands will perform multiple steps otherwise.
    
## References

If you find interesting blog articles or projects based on node-milight-promise, 
please drop me a link by creating an issue.

### Projects using node-milight-promise

* [homebridge-milight](https://www.npmjs.com/package/homebridge-milight) - a plugin for 
  [Homebridge](https://www.npmjs.com/package/homebridge)
  
* [gladys-milight](https://github.com/GladysProject/gladys-milight) - a plugin for 
  [Gladys](https://github.com/GladysProject/Gladys)

* [iobroker.milight](https://www.npmjs.com/package/iobroker.milight) - adapter for 
  [ioBroker](https://www.npmjs.com/package/iobroker)
  
* [ioBroker.milight-smart-light](https://github.com/Steiger04/ioBroker.milight-smart-light)- yet another adapter for 
  [ioBroker](https://www.npmjs.com/package/iobroker)

* [@homenet/plugin-milight](https://www.npmjs.com/package/@homenet/plugin-milight) - plugin for 
  [Homenet](https://www.npmjs.com/package/@homenet/core)

* [pimatic-milight-reloaded](https://www.npmjs.com/package/pimatic-milight-reloaded) - a plugin for 
  [pimatic](https://pimatic.org/) to control your lights

* [pimatic-led-light](https://www.npmjs.com/package/pimatic-led-light) - another plugin for 
  [pimatic](https://pimatic.org/) to control your lights

* [node-red-contrib-milight-wrapper](https://www.npmjs.com/package/node-red-contrib-milight-wrapper) - 
  a [Node-RED](https://nodered.org/) node to control your lights

* [node-red-contrib-milight](https://www.npmjs.com/package/node-red-contrib-milight) - another node for 
  [Node-RED](https://nodered.org/) to control your lights

* [node-milight-local-promise](node-milight-local-promise) - extension of node-milight-promise 
  to work with locally connected milight controllers on an embedded platform

* [milight-buildlight](https://www.npmjs.com/package/milight-buildlight) - module to create a 
  colour-changing build light for [CircleCI](https://www.npmjs.com/package/circleci)

* [limitless-pushbullet](https://www.npmjs.com/package/limitless-pushbullet) - make your lights blink when 
  you receive a pushbullet notification
  
* [MiLight ibox-support for Homey (dev)](https://github.com/athombv/com.milight/tree/ibox-support) - connect 
  your MiLight (EasyBulb) light bulbs with [Athom Homey](https://www.athom.com)
  
* [milights-bridge](https://github.com/KevinVR/milights-bridge) - a remote control application for your 
  Milight lights. It provides a device agnostic Web UI as well as an API for third-party applications.

### Articles

* [Full control of your LimitlessLED/Milight bulbs from Amazon Echo](http://codecorner.galanter.net/2017/02/24/full-control-of-your-limitless-ledmilight-v6-bulbs-from-amazon-echo/) 
  by Yuriy -  an example on how to control your lights using Amazon Echo using 
  [HA-Bridge](https://github.com/bwssytems/ha-bridge) along with some glue code

* [IoT Part 2 - And There Shall be Light (the smartphone said)](http://www.noamsh.com/iot-part-2-and-there-shall-be-light-the-smartphone-said/) 
  by Noam Shemesh - turn on the lights based on video motion detection or when a pushbullet notification is received, 
  see also [limitless-pushbullet](https://www.npmjs.com/package/limitless-pushbullet) written by Noam

## History

See [Release History](https://github.com/mwittig/node-milight-promise/blob/master/HISTORY.md).

## License 

Copyright (c) 2015-2018, Marcus Wittig and contributors. All rights reserved.

[MIT License](https://github.com/mwittig/node-milight-promise/blob/master/LICENSE)
