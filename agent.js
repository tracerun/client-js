const client = require('./client');
const path = require('path');
const os = require('os');
const fs = require('fs');
const spawn = require('child_process').spawn;

exports.start = function (resp) {
  client.setErrFunc(() => {
    // port not open
    let program = "tracerun";
    if (process.platform === "win32") {
      program = "tracerun.exe";
    }

    let traceRunFolder = getTraceRunFolder();
    let programPath = path.format({
      dir: traceRunFolder,
      base: program
    });

    if (fs.existsSync(programPath)) {
      startDaemon(traceRunFolder, program);
      resp();
    } else {
      // download the program
      downloadTraceRun(traceRunFolder, err => {
        if (!err) {
          startDaemon(traceRunFolder, program);
        }
        resp(err);
      });
    }
  });

  let metaClient = new client.Client();
  metaClient.getMeta(meta => {
    if (meta.version > 0) {
      resp();
    } else {
      resp(new Error("meta version wrong"));
    }
  });
};

function getLatestVersion(resp) {
  let req = require('request');

  req.get("https://api.github.com/repos/tracerun/tracerun/releases/latest", {
    headers: {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "tracerun"
    }
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var info = JSON.parse(body);
      resp(null, info["tag_name"]);
    } else {
      resp(error, null);
    }
  });
};

function downloadTraceRun(programFolder, resp) {
  let arch = process.arch;
  if (arch === "ia32") {
    arch = "386";
  } else if (arch === "x64") {
    arch = "amd64";
  } else if (arch === "arm") {
    arch = "arm64";
  }

  let ext = "tar.gz";
  let platform = process.platform;
  if (platform === "win32") {
    platform = "windows";
    ext = "zip";
  } else if (platform === "darwin") {
    ext = "zip";
  } else if (platform !== "freebsd" || platform !== "linux") {
    resp(new Error("platform not support"));
    return;
  }

  getLatestVersion((err, version) => {
    if (err) {
      resp(err);
    } else {
      // got version
      let baseLink = "https://github.com/tracerun/tracerun/releases/download/" + version;
      let fileName = "tracerun" + "_" + version + "_" + platform + "_" + arch + "." + ext;

      download(baseLink + "/" + fileName, "./" + fileName, err => {
        if (err) {
          resp(err);
        } else {
          decompress(fileName, programFolder, err => {
            resp(err);
          });
        }
      });
    }
  });
};

function getTraceRunFolder() {
  let tracerunPath = path.format({
    dir: os.homedir(),
    base: ".tracerun"
  });

  if (!fs.existsSync(tracerunPath)) {
    fs.mkdirSync(tracerunPath);
  }
  return tracerunPath;
}

function startDaemon(folder, program) {
  spawn(program, ["--db", "db", "-o", "log", "--nostd", "start", "-d"], {
    cwd: folder
  });
}

function download(url, dest, cb) {
  let https = require('follow-redirects').https;
  let file = fs.createWriteStream(dest);

  https.get(url, function (response) {
    response.pipe(file);
    file.on('finish', function () {
      file.close();  // close() is async, call cb after close completes.
      cb();
    });
  }).on('error', function (err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    cb(err);
  });
};

function decompress(file, programFolder, callback) {
  const decomp = require('decompress');

  decomp(file, programFolder).then(() => {
    fs.unlinkSync(file);
    callback();
  }).catch(function (err) {
    callback(err);
  });
}
