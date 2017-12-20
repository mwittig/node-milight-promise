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
  light.sendCommands(commands.white.on(zone), commands.white.maxBright(zone));
  light.pause(1000);

  light.sendCommands(commands.white.nightMode(zone));
  light.pause(1000);

  light.sendCommands(commands.white.maxBright(zone));
  light.pause(1000);

  light.sendCommands(commands.white.off(zone));
  light.pause(1000);

  light.sendCommands(commands.white.on(zone));
  light.pause(1000);

  for (var x = 0; x < 10; x++) {
    light.sendCommands(commands.white.brightDown(zone));
    light.pause(100);
  }
  for (var x = 0; x < 10; x++) {
    light.sendCommands(commands.white.brightUp(zone));
    light.pause(100);
  }

  for (var x = 0; x < 10; x++) {
    light.sendCommands(commands.white.warmer(zone));
    light.pause(100);
  }

  for (var x = 0; x < 10; x++) {
    light.sendCommands(commands.white.cooler(zone));
    light.pause(100);
  }

  light.close().then(function () {
    console.log("All command have been executed - closing Milight");
  });
  console.log("Invocation of asynchronous Milight commands done");
}).catch(function(error) {
  console.log(error);
  light.close();
});