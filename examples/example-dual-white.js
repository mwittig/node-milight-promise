var Milight = require('../src/index').MilightController;
var commands = require('../src/index').commands;

// Important Notes:
// *  Instead of providing the global broadcast address which is the default, you should provide the IP address
//    of the Milight Controller for unicast mode. Don't use the global broadcast address on Windows as this may give
//    unexpected results. On Windows, global broadcast packets will only be routed via the first network adapter. If
//    you want to use a broadcast address though, use a network-specific address, e.g. for `192.168.0.1/24` use
//    `192.168.0.255`.
// *  Note, for WW/CW bulbs the property `commandRepeat` needs to be one to `1`, as the brightnessUp/brightnessDown,
//    and warmer/cooler commands will perform multiple steps otherwise.

var light = new Milight({
        ip: "255.255.255.255",
        delayBetweenCommands: 100,
        commandRepeat: 1
    }),
    zone = 0;

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
    light.sendCommands(commands.white.brightDown());
    light.pause(1000);
}
for (var x = 0; x < 10; x++) {
    light.sendCommands(commands.white.brightUp());
    light.pause(1000);
}

for (var x = 0; x < 10; x++) {
    light.sendCommands(commands.white.warmer());
    light.pause(1000);
}

for (var x = 0; x < 10; x++) {
    light.sendCommands(commands.white.cooler());
    light.pause(1000);
}

light.close().then(function () {
    console.log("All command have been executed - closing Milight");
});
console.log("Invocation of asynchronous Milight commands done");
