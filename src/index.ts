import Client from "./client"

function errFunc(err: Error) {
  console.log(err)
}

const cli = new Client(1989, "127.0.0.1", errFunc);

cli.addAction("abcd");

setTimeout(function() {
  cli.ping();
}, 31000);