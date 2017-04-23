var log = require('winston');
var net = require('net');

log.remove(log.transports.Console);
log.add(log.transports.Console, { 'timestamp': true });

log.level = 'debug';

var client = net.createConnection({ port: 8870 }, function () {
  log.info('connected to server!');

  var buf = new Buffer(23);
  buf.writeUInt16LE(20);
  buf.writeUIntLE(0);

  for (var i = 0; i < 20; i++) {
    buf.writeUInt8(i);
  }

  client.write(buf);
});

client.on('error', function (e) {
  log.error(e);
});

client.on('data', function (data) {
  log.debug(data);
});

client.on('end', function () {
  log.debug('connection ended.');
});

client.setTimeout(500);
