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
  }),
  zone = 0;

// Start the program right after powering up the bulb.
// Make sure the bulb has not been linked, yet. Otherwise, you need to unlink the bulb first from the assigned
// zone first. When unlink is in progress the bulb will flash red for 5 seconds. When it stops flashing power down
// the bulb. On next power up you can link the bulb. When link is is in progress the bulb will flash green for
// 5 seconds. After five seconds the bulb will then process other commands received.
light.sendCommands(commands.fullColor.link(zone));

// We need to wait 5 seconds before for the pairing mode to complete before we can send other commands.
light.pause(5000);

light.sendCommands(commands.fullColor.on(zone), commands.fullColor.whiteMode(zone), commands.fullColor.brightness(zone, 100));

light.close().then(function () {
  console.log("All command have been executed - closing Milight");
});
console.log("Invocation of asynchronous Milight commands done");