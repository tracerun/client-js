import { client } from "../index";
import assert from "assert";

it('should have err when connect to a non-open port', (done) => {
  client.setErrFunc(err => {
    assert.equal("ECONNREFUSED", err.code);
    done();
  });

  let errClient = new client.Client(1234, "127.0.0.1");
  errClient.ping();

  // this.timeout(5000);
});
