exports.getLatestVersion = function (resp) {
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

exports.downloadTraceRun = function (resp) {
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
    resp(new Error("platform not support"), false);
    return;
  }

  this.getLatestVersion((err, version) => {
    if (err) {
      resp(err);
    } else {
      let baseLink = "https://github.com/tracerun/tracerun/releases/download/" + version;
      let fileName = "tracerun" + "_" + version + "_" + platform + "_" + arch + "." + ext;

      download(baseLink + "/" + fileName, "./" + fileName, err => {
        if (err) {
          resp(err);
        } else {
          decompress(fileName, err => {
            resp(err);
          });
        }
      });
    }
  });
};

function download(url, dest, cb) {
  let https = require('follow-redirects').https;
  let fs = require('fs');

  let file = fs.createWriteStream(dest);
  let request = https.get(url, function (response) {
    response.pipe(file);
    file.on('finish', function () {
      file.close(cb);  // close() is async, call cb after close completes.
    });
  }).on('error', function (err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
};

function decompress(file, callback) {
  const decomp = require('decompress');

  decomp(file, "./").then(files => {
    callback();
  }).catch(function (err) {
    callback(err);
  });
}
