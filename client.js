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

  getInfo(route, obj, callback) {
    let conn = getExchConn(this.port, this.address);
    let buf = getHeaderBuf(0, route);
    conn.on("data", data => {
      let msg = readOne(route, data);
      if (msg.error !== undefined) {
        errFunc(msg.error);
      } else {
        let result = obj.deserializeBinary(new Uint8Array(msg.buf));
        callback(result.toObject());
      }
    });
    conn.write(buf);
  }

  getMeta(callback) {
    this.getInfo(2, service.Meta, callback);
  }

  addAction(target) {
    this.checkSendConn();

    let targetBuf = new Buffer(target);
    let headerBuf = getHeaderBuf(targetBuf.length, 10);

    this.sendConn.write(headerBuf);
    this.sendConn.write(targetBuf);
  }

  getActions(callback) {
    this.getInfo(11, service.AllActions, callback);
  }

  getTargets(callback) {
    this.getInfo(20, service.Targets, callback);
  }

  getSlots(target, from, to, callback) {
    let route = 21;

    let range = new service.SlotRange();
    range.setTarget(target);
    range.setStart(from);
    range.setEnd(to);

    let bytes = new Buffer(range.serializeBinary());
    let headerBuf = getHeaderBuf(bytes.length, 21);

    let conn = getExchConn(this.port, this.address);
    conn.on("data", data => {
      let msg = readOne(route, data);
      if (msg.error !== undefined) {
        errFunc(msg.error);
      } else {
        let result = service.Slots.deserializeBinary(new Uint8Array(msg.buf));
        callback(result.toObject());
      }
    });
    conn.write(headerBuf);
    conn.write(bytes);
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
