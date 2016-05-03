# Release History

* 20150426, V0.0.1
    * Initial Version
* 20150510, V0.0.2
    * Improved and simplified synchronization of command sequences
    * Added repeat mode to send each sequences multiple times
* 20150901, V0.0.3
    * Corrected commands, added RGBW night mode, and cleanup - big thanks to @dotsam for his contribution!
    * Revised license information to provide a SPDX 2.0 license identifier according to npm v2.1 guidelines 
      on license metadata - see also https://github.com/npm/npm/releases/tag/v2.10.0
* 20151219, V0.0.4
    * New example code for RGBW and WW/CW bulbs
    * Revised README
* 20160305, V0.0.5
    * Replaced deprecated use of Promise.settle()
    * Added baseline for automated builds and tests (travis, istanbul, coveralls)
    * Added some tests cases
* 20160409, V0.0.6
    * Dependency update
    * Made "lodash.flattendeep" a "devDependency" as it should
    * Moved release history to separate file
    * Added license info to README
* 20160503, V0.0.7
    * Added bridge discovery function
    * Dependency update
* 20160503, V0.0.8
    * Bug fix: hue value not converted to hex in rgb.hue()
    * Bug fix: Fixed array value checks of MilightController
    * Bug fix: Close discovery socket on error
    * Improved error handling
    * Improved test coverage