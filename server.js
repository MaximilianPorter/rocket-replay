const { exec, spawn: runCommand } = require("child_process");
const fs = require("fs");
// make express app
const express = require("express");
const app = express();
const server = require("http").Server(app);
const cors = require("cors");
const path = require("path");

deleteAllUploads();

const endpoint = "/api/uploads";

// Create a rate limiter with a maximum of 100 requests per hour per IP address
const limiter = require("express-rate-limit")({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // limit each IP to 100 requests per windowMs
  skip: (req, res) => {
    // Skip rate limiting for requests from localhost
    return req.ip === "127.0.0.1" || req.ip === "localhost" || req.ip === "::1";
  },
});

// recieve file from client
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `${__dirname}/uploads`); // specify the directory to save uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // use the original filename for uploaded files
  },
});

// only allow .replay files
const fileFilter = function (req, file, cb) {
  if (!file.originalname.match(/\.(replay)$/)) {
    req.isValidFile = false;
    return cb(new Error("Only .replay files are allowed!"), false);
  } else if (file.fieldname !== "replay") {
    return cb(
      new Error("FormData in body must have a value named 'replay'"),
      false
    );
  } else {
    return cb(null, true);
  }
};
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // only allow files up to 5MB
  },
  fileFilter,
});
const uploadSingle = upload.single("replay");

// Apply the rate limiter to all requests
app.use(limiter);
app.use(cors());

function getRoute(req, res) {
  res.send(
    `Welcome to the Rocket League Replay Parser API, please use a POST request to the endpoint ${req.hostname}/api/uploads to upload a replay file`
  );
}

app.get(`${endpoint}`, getRoute);
app.get(`/`, getRoute);

app.post(`${endpoint}?:n`, (req, res) => {
  uploadSingle(req, res, (err) => {
    // return if file is not correct
    if (err) {
      console.log("ERROR IS HAPPENING!");
      if (!req.file || !req || !req.isValidFile) {
        return res.status(500).send({
          success: false,
          message:
            "Format is incorrect, ensure that the file is a .replay and that the FormData value for the file in the body is named 'replay'",
        });
      }
    }

    const args = ["-p"];
    const command = "rrrocket";

    // check post url for network parse flag
    const networkParse = req.url.includes("network=true");
    if (networkParse) {
      args.push("-n");
    }

    // add the file path to the arguments
    args.push(`${req.file.path}`);

    // Spawn a new process with the rrrocket command and arguments
    const rrrocketProcess = runCommand(command, args);

    // Capture the output of the command
    let output = "";
    rrrocketProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    // Handle errors from the command
    rrrocketProcess.stderr.on("data", (data) => {
      console.error(`Error: ${data}`);
    });

    // Handle the completion of the command
    rrrocketProcess.on("close", (code) => {
      if (code === 0) {
        // Send the output to the client
        res.status(201).send(output);
        console.log("Command completed successfully!");

        // Delete the uploaded file
        fs.unlinkSync(req.file.path);
      } else {
        console.error(`Command failed with code ${code}`);
        res.status(500).send({
          success: false,
          message: "Something went wrong",
        });
      }
    });
  });
});

async function deleteAllUploads() {
  const directory = `${__dirname}/uploads/`;

  if (!fs.existsSync(directory)) {
    console.log("Uploads folder does not exist, creating...");
    fs.mkdirSync(directory);
  }

  try {
    fs.readdir(directory, (err, files) => {
      if (err) throw err;

      for (const file of files) {
        if (file === ".gitkeep") continue;
        fs.unlink(path.join(directory, file), (err) => {
          if (err) throw err;
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
}

// Start the server
let port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server listening at port ${port}`);
});

/*

Parses Rocket League replay files and outputs JSON with decoded information

USAGE:
    rrrocket [FLAGS] [input]...

FLAGS:
    -n, --network-parse    parses the network data of a replay instead of skipping it
    -c, --crc-check        forces a crc check for corruption even when replay was successfully parsed
        --dry-run          parses but does not write JSON output
    -h, --help             Prints help information
    -j, --json-lines       output multiple files to stdout via json lines
    -m, --multiple         parse multiple replays in provided directories. Defaults to writing to a sibling JSON file,
                           but can output to stdout with --json-lines
    -p, --pretty           output replay as pretty-printed JSON
    -V, --version          Prints version information

ARGS:
    <input>...    Rocket League replay files

*/
