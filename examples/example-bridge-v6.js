var Milight = require('../src/index');
var commands = Milight.commandsV6;

// Important Notes:
// *  Instead of providing the global broadcast address which is the default, you should provide the IP address
//    of the Milight Controller for unicast mode. Don't use the global broadcast address on Windows as this may give
//    unexpected results. On Windows, global broadcast packets will only be routed via the first network adapter. If
//    you want to use a broadcast address though, use a network-specific address, e.g. for `192.168.0.1/24` use
//    `192.168.0.255`.

var light = new Milight.MilightController({
    ip: "255.255.255.255",
    type: 'v6'
  });

light.ready().then(function() {
  // Switch On, White Mode, Brightness 100%
  light.sendCommands(commands.bridge.on(), commands.bridge.whiteMode(), commands.bridge.brightness(100));
  light.pause(1000);

  // Switch Off
  light.sendCommands(commands.bridge.off());
  light.pause(1000);

  // Switch On again
  light.sendCommands(commands.bridge.on());
  light.pause(1000);

  // Set Hue
  for (var x = 0; x < 256; x += 5) {
    light.sendCommands(commands.bridge.hue(x));
    if (x === 0) {
      light.sendCommands(commands.bridge.brightness(100))
    }
  }
  light.pause(1000);

  // Switch Off
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

  // Switch Off
  light.sendCommands(commands.bridge.off());
  light.pause(1000);

  light.close().then(function () {
    console.log("All command have been executed - closing Milight");
  });
  console.log("Invocation of asynchronous Milight commands done");
}).catch(function(error) {
  console.log(error);
  light.close();
});