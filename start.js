const client = require('./client');
const path = require('path');
const os = require('os');

client.setErrFunc(err => {
  console.log(err);
});

let metaClient = new client.Client();
metaClient.getMeta(meta => {
  console.log(meta);
});

// agent.start(ok => {
//   console.log("ok", ok);
// });