# Release History
* 20190115, V0.3.2
    * Fixed effect mode command for 8-zone, thanks @Steiger04
    * Added return to avoid orphan Promise warning, thanks @jbchouinard
    * Enhanced error handling for sendCommand, issue #26
    * Added support for node 10
    * Dependency updates
* 20180131, V0.3.1
    * Refactored commands for RGB and RGBW hue
    * Dependency updates
* 20171227, V0.3.0
    * Added support for 8-zone controller CCT, issue #37
    * Reduced session timeout to 30 seconds for better compatibility with iBox2, issues #37 & #38
    * Made session timeout configurable, issue #38
* 20170929, V0.2.32
    * Added hexToRgb helper function, thanks @msunjic98
* 20170727, V0.2.31
    * Bug fix: remove timer if exception is caught while rpc is in progress
* 20170721, V0.2.3
    * Fixed travis build issue caused by gulp task synchronization issue (reverted 
      change of gulp default task committed in the previous release)
    * Fixed typo
* 20170719, V0.2.2
    * Bug fix: Fixed bridge.rgb() using wrong color circle
    * Bug fix: Ensure v6 checksum calculation works correctly even if some bytes contains number strings
    * Added type check for ip address property to Milight constructor
    * Added alias rgbw.rgb() to legacy command set
    * Changed default gulp task to include build task
* 20170715, V0.2.1
    * Bug fix: Let helper.assign ignore undefined values
* 20170715, V0.2.0
    * Added synchronization of Milight command across multiple Milight instances
    * Dependency updates
    * Added more tests, improved test coverage
* 20170612, V0.1.5
    * Added effect mode commands for bridge light
* 20170610, V0.1.4
    * Added V6 link/unlink commands to support V6 pairing protocol, issue #21
    * Bug fix: Fixed fullColor.rgb() giving wrong colors
    * Dependency update
* 20170520, V0.1.3
    * Fixed RGBW effectMode V6 command, thanks @RobinBol
* 20170404, V0.1.2
    * Bug fix: Fixed fullColor.rgb() using wrong color circle, issue #18
    * Added dependency badge
    * Fixed some typos
* 20170316, V0.1.1
    * Added invertValue parameter to full color saturation command. This may be set to true to get a proper 
      percentage saturation. Note, the native Milight saturation value is inverted, where 0 is maximum saturation.
    * Fixed full color rgb command which did not provide the proper hue for red (#ff0000).
    * Added helper function rgbToFullColorHsv()
    * Added more tests
* 20170123, V0.1.0
    * Added support for the new WiFi Bridge protocol v6.0
* 20160513, V0.0.9
    * Bug fix: Brightness level never reached maximum brightness for RGBW
    * Bug fix: With `commandRepeat > 1` stacked commands were sent in wrong order
    * Bug fix: Broadcast mode wasn't set automatically with a network-specific 
      broadcast ip address
    * Added `rgbw.brightness2()` which maps brightness 0-100 to 22 levels
    * Added support for using 2-byte command sequences
    * Changed default command delay and repeat values
    * Updated examples
* 20160503, V0.0.8
    * Bug fix: Hue value not converted to hex in rgb.hue()
    * Bug fix: Fixed array value checks of MilightController
    * Bug fix: Close discovery socket on error
    * Improved error handling
    * Improved test coverage
* 20160503, V0.0.7
    * Added bridge discovery function
    * Dependency update
* 20160409, V0.0.6
    * Dependency update
    * Made "lodash.flattendeep" a "devDependency" as it should
    * Moved release history to separate file
    * Added license info to README
* 20160305, V0.0.5
    * Replaced deprecated use of Promise.settle()
    * Added baseline for automated builds and tests (travis, istanbul, coveralls)
    * Added some tests cases
* 20151219, V0.0.4
    * New example code for RGBW and WW/CW bulbs
    * Revised README
* 20150901, V0.0.3
    * Corrected commands, added RGBW night mode, and cleanup - big thanks to @dotsam for his contribution!
    * Revised license information to provide a SPDX 2.0 license identifier according to npm v2.1 guidelines 
      on license metadata - see also https://github.com/npm/npm/releases/tag/v2.10.0
* 20150510, V0.0.2
    * Improved and simplified synchronization of command sequences
    * Added repeat mode to send each sequences multiple times
* 20150426, V0.0.1
    * Initial Version



