var discoverBridges = require('../src/index').discoverBridges;

discoverBridges().then(function (results) {
    console.log(results);
});