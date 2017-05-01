import * as net from "net";

let errFunc;

export function setErrFunc(func) {
  errFunc = func;
}

export class Client {
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

  addAction(target) {
    this.checkSendConn();

    let length = Buffer.byteLength(target);
    let buf = getHeaderBuf(length, 10);
    let total = Buffer.alloc(length + 3);

    buf.copy(total);
    total.write(target, 3);
    this.sendConn.write(total);
  }

  getMeta(metaCallback) {
    let conn = getExchConn();
    let buf = getHeaderBuf(0, 2);
    conn.on("data", data => {

    });
    conn.write(buf);
  }
}

function getExchConn(port, addr) {
  let conn = net.createConnection({ port: port, host: addr });
  conn.on("error", err => {
    errFunc(err);
  });
  return conn;
}

function getHeaderBuf(count, route) {
  let buf = new Buffer(3);
  buf.writeUInt16LE(count, 0);
  buf.writeUInt8(route, 2);
  return buf;
}
