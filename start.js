const client = require('./client');
const path = require('path');
const os = require('os');

// client.setErrFunc(err => {
//   console.log(err);
// });

// let cli = new client.Client();
// cli.getMeta(meta => {
//   console.log("meta:", meta);
// });

// cli.getActions(actions => {
//   console.log("actions:", actions);
// });

// cli.getTargets(targets => {
//   console.log("targets:", targets);
// });

// cli.getSlots("c:\\Users\\drkaka\\Desktop\\Untitled-1.txt", 0, 0, slots => {
//   console.log("slots:", slots);
// });

const agent = require('./agent');

agent.start(err => {
  if (err) {
    console.error(err);
  } else {
    console.log("ok");
  }

});
