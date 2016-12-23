var Milight = require('../src/index').MilightController;
var commands = require('../src/index').commands2;
var commandsV6 = require('../src/index').commandsV6;

// A visual test to compare the color model implemented by the V4/V5 bridge compared to the V6.
// You'll need:
// - a V4/V5 bridge
// - a V6 bridge with bridge light (comment out bridge commands if you don't have the bridge light version)
// - a RGBW bulb
// Instead of using broadcast addresses use the IP address of the bridges to avoid jitter.

var light = new Milight({
    ip: "192.168.178.xx",
    delayBetweenCommands: 80,
    commandRepeat: 2
  }),
  zone = 1,
  lightV6 = new Milight({
    ip: "192.168.178.yy",
    type: 'v6'
  });

// The hue value to set
var hue = 0x80;
// If true the transformation to hue circle of the V4 RGBW lights is performed
var transform=true;

light.sendCommands(commands.rgbw.off(zone));
light.sendCommands(commands.rgbw.on(zone));
light.sendCommands(commands.rgbw.hue(hue));
light.sendCommands(commands.rgbw.brightness(100));
lightV6.pause(1000);

lightV6.sendCommands(commandsV6.rgbw.off(zone));
lightV6.sendCommands(commandsV6.rgbw.on(zone));
lightV6.sendCommands(commandsV6.rgbw.hue(zone, hue, transform));
lightV6.pause(1000);

lightV6.sendCommands(commandsV6.bridge.off());
lightV6.sendCommands(commandsV6.bridge.on());
lightV6.sendCommands(commandsV6.bridge.hue(hue, transform));
lightV6.sendCommands(commandsV6.bridge.brightness(100));
lightV6.pause(1000);

Promise.all([light.close(), lightV6.close()]).then(function () {
  console.log("All command have been executed - closing Milight");
});

console.log("Invocation of asynchronous Milight commands done");
