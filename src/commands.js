/********************************************************************************
 * !!! DO NOT CHANGE command2.js as it is generated from commands.js!!!
 ********************************************************************************/
/**
 Filename: commands.js
 AppLamp.nl led light API: wifi box byte commands
 � AppLamp.nl: you can share,modify and use this code (commercially) as long as you
 keep the referrer "AppLamp.nl led light API" in the file header.

 RESPECT AT LEAST 50 MS BETWEEN EACH SEND COMMAND TO PREVENT PACKAGE LOSS
 The functions in this file will return the appropriate hex commands as 3 byte array
 to send to an UDP-socket towards WIFI BOX-IP:8899 (see wifibox.js)

 Example Usage in Node JS:
 var cmd = require('commands.js');
 example turn on all white bulbs on:
 cmd.white.allOn();
 set the hue of a color bulb to yellow
 cmd.rgbw.hue(128);

 **/


var helper = require('./helper.js');

var ColorRgbwCmd = function(){};
var WhiteCmd     = function(){};
var ColorRgbCmd  = function(){};
//makes the rgb/rgbw/white variables globally available in NodeJS
// for ex. use: commands.rgbw.hue(64);

var exports = { rgb: new ColorRgbCmd()
    ,rgbw: new ColorRgbwCmd()
    ,white: new WhiteCmd() };

module.exports = exports;


/*RGBW BULBS AND CONTROLLERS, 4-CHANNEL/ZONE MODELS */


/* Switch ON() your light or make it ACTIVE 
 * use function parameter `zone` with value '0' to target ALL zones,
 * value '1' for zone 1, value '2' for zone 2,... to 4
 * You can also use this command to link your bulbs
 * Prepend this command once for the appropriate zone to activate the zone
 * before using hue() / brightness() / whiteMode() / effectModeNext()
 */
ColorRgbwCmd.prototype.on = function(zone)
{  return [[0x42,0x45,0x47,0x49,0x4B][zone],0x00,0x55] };

/* use function parameter `zone` with value '0' to target ALL zones, 
 * value '1' for zone 1, value '2' for zone 2,... to 4 */
ColorRgbwCmd.prototype.off = function(zone)
{  return [[0x41,0x46,0x48,0x4A,0x4C][zone],0x00,0x55] };

/* Shortcut to ON(0) */
ColorRgbwCmd.prototype.allOn  = function(){  return this.on(0) };
ColorRgbwCmd.prototype.allOff = function(){  return this.off(0) };

/* Hue range 0-255 [targets last ON() activated bulb(s)] */
ColorRgbwCmd.prototype.hue =  function(value)
{
  if (value > 256) value = 255;
  return [0x40,Number(value),0x55];
};
/* Switch to white mode use function parameter `zone` with value '0' to target ALL zones,
 * value '1' for zone 1, value '2' for zone 2,... to 4 */
ColorRgbwCmd.prototype.whiteMode = function(zone)
{  return [[0xC2,0xC5,0xC7,0xC9,0xCB][zone],0x00,0x55] };

/* Brightness range 1-100 [targets last ON() activated bulb(s)]*/
ColorRgbwCmd.prototype.brightness = function(percent)
{ 	var brightnessIndex = Math.max( 0,(Math.ceil(percent/100*20))-1 ); //19 steps
    return [ 0x4E
        ,[ 0x02,0x03,0x04,0x05,0x08,0x09
            ,0x0A,0x0B,0x0D,0x0E,0x0F,0x10,0x11
            ,0x12,0x13,0x14,0x15,0x17,0x18,0x19][brightnessIndex]
        , 0x55
    ];
};
/* brightness2 uses a extended range of 22 levels as spec'ed by Limitless LED. However,
   0x19,0x1A,0x1B values  did not result in different brightness levels for me (6W bulbs).
 */
ColorRgbwCmd.prototype.brightness2 = 	function(percent)
{ 	var brightnessIndex = Math.max( 0,(Math.ceil(percent/100*22))-1 ); //19 steps
    return [ 0x4E
        ,[ 0x02,0x03,0x04,0x05,0x08,0x09
            ,0x0A,0x0B,0x0D,0x0E,0x0F,0x10,0x11
            ,0x12,0x13,0x14,0x15,0x17,0x18,0x19,0x1A,0x1B][brightnessIndex]
        , 0x55
    ];
};
/* Effect mode next [targets last ON() activated bulb(s)] */
ColorRgbwCmd.prototype.effectModeNext =	function(){  return [0x4D,0x00,0x55] };
ColorRgbwCmd.prototype.effectSpeedUp = 	function(){  return [0x44,0x00,0x55] };
ColorRgbwCmd.prototype.effectSpeedDown= function(){  return [0x43,0x00,0x55] };

/* Switch zone to Night Light Mode with value '0' to target ALL zones,
 * , value '1' for zone 1, value '2' for zone 2,... to 4 */
ColorRgbwCmd.prototype.nightMode = function(zone)
{ return [[0xC1,0xC6,0xC8,0xCA,0xCC][zone],0x00,0x55]; };


ColorRgbwCmd.prototype.hsvToMilightColor=  function hsvToMilightColor(hsv)
{
    // On the HSV color circle (0..360) with red at 0 degree. We need to convert to the Milight color circle
    // which has 256 values with red at position 176
    return (256 + 176 - Math.floor(Number(hsv[0]) / 360.0 * 255.0)) % 256;
};

/**
 * Limitations: As RGBW bulbs do not support setting of saturation, hue and brightness will be set, only.
 * @param r
 * @param g
 * @param b
 * @returns {*[]}
 */
ColorRgbwCmd.prototype.rgb255 = function (r, g, b) {
    var hsv = helper.rgbToHsv(r, g, b),
        hue = this.hue(this.hsvToMilightColor(hsv)),
        brightness = this.brightness(hsv[2]);
    return [hue, brightness];
};

ColorRgbwCmd.prototype.rgb = function (r, g, b) {
  return exports.rgbw.rgb255.call(exports.rgbw, r, g, b);
};

/* DUAL WHITE BULBS & CONTROLLERS */


/* Switch ON() your light or make it ACTIVE 
 * use function parameter `zone` with value '0' to target ALL zones,
 * value '1' for zone 1, value '2' for zone 2,... to 4
 * You can also use this command to link your bulbs
 * Prepend this command once for the appropriate zone to activate the zone
 * before using brightUp() / brightDown() / warmer() / cooler() */
WhiteCmd.prototype.on = function(zone){  return [[0x35,0x38,0x3D,0x37,0x32][zone],0x00,0x55]; };

/* Switch OFF zone with value '0' to target ALL zones, 
 * , value '1' for zone 1, value '2' for zone 2,... to 4 */
WhiteCmd.prototype.off = function(zone)
{ return [[0x39,0x3B,0x33,0x3A,0x36][zone],0x00,0x55]; };

/* Switch zone to Night Light Mode with value '0' to target ALL zones, 
 * , value '1' for zone 1, value '2' for zone 2,... to 4 */
WhiteCmd.prototype.nightMode = function(zone)
{ return [[0xB9,0xBB,0xB3,0xBA,0xB6][zone],0x00,0x55]; };

/* Switch zone to maximum brightness with value '0' to target ALL zones, 
 * , value '1' for zone 1, value '2' for zone 2,... to 4 */
WhiteCmd.prototype.maxBright = function(zone)
{ return [[0xB5,0xB8,0xBD,0xB7,0xB2][zone],0x00,0x55]; };

WhiteCmd.prototype.allOn = 		function(){ return this.on(0) };
WhiteCmd.prototype.allOff = 		function(){ return this.off(0) };
WhiteCmd.prototype.brightUp = 		function(){ return [0x3C,0x00,0x55] };
WhiteCmd.prototype.brightDown = 	function(){ return [0x34,0x00,0x55] };
WhiteCmd.prototype.warmer = 		function(){ return [0x3E,0x00,0x55] };
WhiteCmd.prototype.cooler = 		function(){ return [0x3F,0x00,0x55] };


/* RGB BULBS & CONTROLLERS, PREVIOUS GENERATION SINGLE CHANNEL/ZONE*/

ColorRgbCmd.prototype.off = function(){ return [0x21,0x00,0x55] };
ColorRgbCmd.prototype.on = function(){ return [0x22,0x00,0x55] };
ColorRgbCmd.prototype.hue = function(value)
{
    if (value > 256) value = 255;
    return [0x20,Number(value),0x55];
};
ColorRgbCmd.prototype.brightUp = 	function(){ return [0x23,0x00,0x55] };
ColorRgbCmd.prototype.brightDown = 	function(){ return [0x24,0x00,0x55] };
ColorRgbCmd.prototype.speedUp = 	function(){ return [0x25,0x00,0x55] };
ColorRgbCmd.prototype.speedDown = 	function(){ return [0x26,0x00,0x55] };
ColorRgbCmd.prototype.effectSpeedUp = 	function(){ return [0x27,0x00,0x55] };
ColorRgbCmd.prototype.effectSpeedDown = function(){ return [0x28,0x00,0x55] };
 
