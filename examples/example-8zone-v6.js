var Milight = require('../src/index');
var commands = Milight.commandsV6;

// Important Notes:
// *  Instead of providing the global broadcast address which is the default, you should provide the IP address
//    of the Milight Controller for unicast mode. Don't use the global broadcast address on Windows as this may give
//    unexpected results. On Windows, global broadcast packets will only be routed via the first network adapter. If
//    you want to use a broadcast address though, use a network-specific address, e.g. for `192.168.0.1/24` use
//    `192.168.0.255`.
// *  Note, for the V6 command set each command must be provided with a zone parameter as shown in the example below!

var light = new Milight.MilightController({
    ip: "255.255.255.255",
    type: 'v6'
  }),
  zone = 0;

light.ready().then(function() {
  light.sendCommands(commands.fullColor8Zone.on(zone), commands.fullColor8Zone.whiteMode(zone), commands.fullColor8Zone.brightness(zone, 100));
  light.pause(1000);

  light.sendCommands(commands.fullColor8Zone.off(zone));
  light.pause(1000);

  // Setting Hue
  light.sendCommands(commands.fullColor8Zone.on(zone));
  light.pause(1000);
  for (var x = 0; x < 256; x += 5) {
    light.sendCommands(commands.fullColor8Zone.hue(zone, x));
    if (x === 0) {
      light.sendCommands(commands.fullColor8Zone.brightness(zone, 100))
    }
  }
  light.pause(1000);

  light.sendCommands(commands.fullColor8Zone.off(zone));
  light.pause(1000);

  // Back to white mode with different color temperatures
  light.sendCommands(commands.fullColor8Zone.on(zone));
  light.pause(1000);
  for (var x = 0; x <= 100; x += 1) {
    light.sendCommands(commands.fullColor8Zone.whiteTemperature(zone, x));
    if (x === 0) {
      light.sendCommands(commands.fullColor8Zone.brightness(zone, 100))
    }
  }
  light.pause(1000);

  // Setting Brightness (dimming down)
  light.sendCommands(commands.fullColor8Zone.on(zone));
  for (var x = 100; x >= 0; x -= 5) {
    light.sendCommands(commands.fullColor8Zone.brightness(zone, x));
  }
  light.pause(1000);

  light.sendCommands(commands.fullColor8Zone.off(zone));
  light.pause(1000);

  light.close().then(function () {
    console.log("All command have been executed - closing Milight");
  });
  console.log("Invocation of asynchronous Milight commands done");
}).catch(function(error) {
  console.log(error);
  light.close();
});