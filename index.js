const client = require('./client');
const agent = require('./agent');

module.exports = {
  client: client,
  agent: agent
};


client.setErrFunc(err => {
  console.log(err);
});

let metaClient = new client.Client();
metaClient.getMeta(meta => {
  console.log(meta);
});

agent.getLatestVersion((err, version) => {
  if (err != undefined) {
    console.error(err);
  } else {
    console.log("version:", version);
  }
});

agent.downloadTraceRun((err, success) => {
  if (err != undefined) {
    console.error(err);
  } else {
    console.log("success:", success);
  }
});

