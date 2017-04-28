import * as net from "net";

export default class Client {
  private readonly port: number;
  private readonly address: string;
  private readonly errFunc: (err: Error) => void;
  private sendConn: net.Socket;

  constructor(port: number, addr: string, func: (err: Error) => void) {
    this.port = port;
    this.address = addr;
    this.errFunc = func;
  }

  private checkSendConn() {
    if (this.sendConn === undefined) {
      this.sendConn = net.createConnection({ port: this.port, host: this.address });
      this.sendConn.on("end", data => {
        this.sendConn.end()
        this.sendConn = undefined;
      })
      this.sendConn.on("error", err => {
        this.errFunc(err)
        this.sendConn = undefined;
      })
    }
  }

  private getExchConn(): net.Socket {
    let conn = net.createConnection({ port: this.port, host: this.address });
    conn.on("error", err => {
      this.errFunc(err)
    })
    return conn
  }

  ping() {
    this.checkSendConn();

    let buf = getHeaderBuf(0, 1);
    this.sendConn.write(buf);
  }

  addAction(target: string) {
    this.checkSendConn();

    let length = Buffer.byteLength(target);
    let buf = getHeaderBuf(length, 10);
    let total = Buffer.alloc(length + 3);

    buf.copy(total);
    total.write(target, 3);
    this.sendConn.write(total);
  }
}

function getHeaderBuf(count: number, route: number): Buffer {
  let buf = new Buffer(3);
  buf.writeUInt16LE(count, 0);
  buf.writeUInt8(route, 2);
  return buf
}
