var discoverBridges = require('../src/index').discoverBridges;

// *   Use type 'all' to discover, both, legacy and v6 bridges
// *   Use type 'v6' to discover v6 bridges will be discovered, only
// *   If no type set, legacy bridges will be discovered, only
discoverBridges({
  type: 'v6'
}).then(function (results) {
  console.log(results);
});