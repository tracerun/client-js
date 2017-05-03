const client = require("../index").client;

describe('Client tests', function () {
  it('should have err when connect to a non-open port', (done) => {
    client.setErrFunc(err => {
      console.log("with err code", err.code);
      if (err.code === "ECONNREFUSED") {
        done();
      } else if (err.code === "EADDRNOTAVAIL") {
        done();
      } else {
        done(err);
      }
    });

    let errClient = new client.Client(1234, "127.0.0.1");
    errClient.ping();
  });

  it('should be able to get meta information', (done) => {
    client.setErrFunc(err => {
      done(err);
    });

    let metaClient = new client.Client();
    metaClient.getMeta(meta => {
      console.log(meta);
      done();
    });
  });

});
