var PORT = 20560;
var HOST = '192.168.178.255';

var dgram = require('dgram');
var buffer = Buffer([
    0xFF, 0xFF, 0xFF, 0xFF,
    0xFF, 0xFF, 0x45, 0x44,
    0x49, 0x4d, 0x41, 0x58,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0xA1,
    0xFF, 0x5E
]);

var discoverer = dgram.createSocket('udp4');
discoverer.bind();

discoverer.on('listening', function () {
    discoverer.setBroadcast(true);
    var address = discoverer.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);

    discoverer.send(buffer, 0, buffer.length, PORT, HOST, function(err, bytes) {
        //if (err) throw err;
        console.log('UDP message sent to ' + HOST +':'+ PORT);
        //discoverer.close();
    });
});

function bufIndexOf(buffer, byteVal, start, end) {
    var pos = start;
    for (; pos < end; pos++) {
        if (buffer[pos] === byteVal) {
            break;
        }
    }
    return pos;
}
function bytesToIpAddress(bytes) {
    if (bytes.length === 4) {
        return "" + bytes[0] + "." + bytes[1] + "." + bytes[2] + "." + bytes[3];
    }
    else {
        throw new Error("Buffer does not contain IPv4 address")
    }
}
function toHexString(d) {
    return  ("0"+(Number(d).toString(16))).slice(-2).toUpperCase()
}
function bytesToMacAddress(bytes) {
    if (bytes.length === 6) {
        return "" + toHexString(bytes[0]) + ":" + toHexString(bytes[1]) + ":" + toHexString(bytes[2])
            + ":" + toHexString(bytes[3]) + ":" + toHexString(bytes[4]) + ":" + toHexString(bytes[5]);
    }
    else {
        throw new Error("Buffer does not contain MAC address")
    }
}
function hexDump(bytes) {
    var result="";
    for (x=0; x<bytes.length; x++) {
        result+=toHexString(bytes[x]) +  " "

    }
    return result.trim();
}
discoverer.on('message', function (message, remote) {
    console.log(remote.address + ':' + remote.port +' - ' + message.length + ' bytes');
    console.log(hexDump(message.slice(18, 22))+"---");
    var disco = {
        mac: bytesToMacAddress(message.slice(0, 6)),
        manufacturer: message.toString('ascii', 6, bufIndexOf(message, 0x00, 6, 18)),
        model: message.toString('ascii', 22, bufIndexOf(message, 0x00, 22, 36)),
        version: message.toString('ascii', 36, bufIndexOf(message, 0x00, 36, 44)),
        displayName: message.toString('ascii', 44, bufIndexOf(message, 0x00, 44, 172)),
        port: message.readInt16LE(172),
        addr: bytesToIpAddress(message.slice(174, 178)),
        dstAddr: bytesToIpAddress(message.slice(182, 186))
    };
    console.dir(disco);
    setTimeout(function() {
        discoverer.close();
        console.log("closing");
    }, 3000)
});

discoverer.on('error', function (message, error) {
    console.log(error);

});
console.log(".");














