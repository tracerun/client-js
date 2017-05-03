const net = require("net");
const service = require('./proto/service_pb');

const headerBytes = 3;

let errFunc;

exports.setErrFunc = function (func) {
  errFunc = func;
};

exports.Client = class {
  constructor(port = 19869, addr = "127.0.0.1") {
    this.port = port;
    this.address = addr;
  }

  checkSendConn() {
    if (this.sendConn === undefined) {
      this.sendConn = net.createConnection({ port: this.port, host: this.address });
      this.sendConn.on("end", () => {
        this.sendConn.end();
        this.sendConn = undefined;
      });

      this.sendConn.on("error", err => {
        errFunc(err);
        this.sendConn = undefined;
      });
    }
  }

  ping() {
    this.checkSendConn();

    let buf = getHeaderBuf(0, 1);
    this.sendConn.write(buf);
  }

  getMeta(metaCallback) {
    let route = 2; // meta route

    let conn = getExchConn(this.port, this.address);
    let buf = getHeaderBuf(0, route);
    conn.on("data", data => {
      let msg = readOne(route, data);
      if (msg.error !== undefined) {
        errFunc(msg.error);
      } else {
        let meta = service.Meta.deserializeBinary(new Uint8Array(msg.buf));
        metaCallback(meta.toObject());
      }
    });
    conn.write(buf);
  }

  addAction(target) {
    this.checkSendConn();

    let length = Buffer.byteLength(target);
    let buf = getHeaderBuf(length, 10);
    let total = Buffer.alloc(length + headerBytes);

    buf.copy(total);
    total.write(target, headerBytes);
    this.sendConn.write(total);
  }
};

function getExchConn(port, addr) {
  let conn = net.createConnection({ port: port, host: addr });
  conn.on("error", err => {
    errFunc(err);
  });
  return conn;
}

function getHeaderBuf(count, route) {
  let buf = new Buffer(headerBytes);
  buf.writeUInt16LE(count, 0);
  buf.writeUInt8(route, 2);
  return buf;
}

function readOne(expectRoute, buf) {
  let count = buf.readInt16LE(0);
  let route = buf.readUInt8(2);
  let realBuf = buf.slice(headerBytes, headerBytes + count);

  let err;
  if (route === 255) {
    err = new Error(realBuf.toString());
  } else if (route !== expectRoute) {
    err = new Error("route wrong");
  }

  return {
    error: err,
    count: count,
    route: route,
    buf: realBuf,
  };
}
