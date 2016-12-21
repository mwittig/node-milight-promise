var Milight = require('../src/index').MilightController;
var commands = require('../src/index').commandsV6;

// Important Notes:
// *  Instead of providing the global broadcast address which is the default, you should provide the IP address
//    of the Milight Controller for unicast mode. Don't use the global broadcast address on Windows as this may give
//    unexpected results. On Windows, global broadcast packets will only be routed via the first network adapter. If
//    you want to use a broadcast address though, use a network-specific address, e.g. for `192.168.0.1/24` use
//    `192.168.0.255`.

var light = new Milight({
    ip: "255.255.255.255",
    type: 'v6'
  });

light.sendCommands(commands.bridge.on(), commands.bridge.whiteMode(), commands.bridge.brightness(100));
light.pause(1000);

light.sendCommands(commands.bridge.off());
light.pause(1000);

// Setting Hue
light.sendCommands(commands.bridge.on());
light.pause(1000);

for (var x = 0; x < 256; x += 5) {
  light.sendCommands(commands.bridge.hue(x));
  if (x === 0) {
    light.sendCommands(commands.bridge.brightness(100))
  }
}
light.pause(1000);

light.sendCommands(commands.bridge.off());
light.pause(1000);

// Back to white mode
light.sendCommands(commands.bridge.on(), commands.bridge.whiteMode());
light.pause(1000);

// Setting Brightness
light.sendCommands(commands.bridge.on());
for (var x = 100; x >= 0; x -= 5) {
  light.sendCommands(commands.bridge.brightness(x));
}
light.pause(1000);

light.sendCommands(commands.bridge.off());
light.pause(1000);

light.close().then(function () {
  console.log("All command have been executed - closing Milight");
});
console.log("Invocation of asynchronous Milight commands done");
