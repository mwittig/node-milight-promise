var Milight = require('../src/index').MilightController;
var commands = require('../src/index').commands;


var light = new Milight({
        ip: "255.255.255.255",
        delayBetweenCommands: 30,
        commandRepeat: 3
    }),
    zone = 1;

light.sendCommands(commands.rgbw.on(zone), commands.rgbw.brightness(100));
for (var x = 0; x < 256; x += 5) {
    light.sendCommands(commands.rgbw.on(zone), commands.rgbw.hue(x));
}
light.pause(1000);
light.sendCommands(commands.rgbw.off(zone));
light.pause(1000);
light.sendCommands(commands.rgbw.on(zone));
light.pause(1000);
light.sendCommands(commands.rgbw.off(zone));
light.pause(1000);
light.sendCommands(commands.rgbw.whiteMode(zone), commands.rgbw.on(zone));
light.pause(1000);
light.sendCommands(commands.rgbw.on(zone), commands.rgbw.hue(255));
light.pause(1000);
light.sendCommands(commands.rgbw.on(zone), commands.rgbw.hue(126));
light.pause(1000);
light.sendCommands(commands.rgbw.off(zone));
light.close().then(function () {
    console.log("Finished");
});

