# Rocket Replays (not active)

**_I can't figure out how to run .exe files (spcifically rrrocket.exe) from a heroku server. It keeps crashing the server. If you know how, dm me on [twitter](https://twitter.com/TheMaxPorter)_**

This is a public api that I made to simplify the process of retriving Rocket League replay file data to web developers through POST api calls. The process is conducted on this server to decode the replay data using the [rrrocket](https://github.com/nickbabcock/rrrocket)

It's basically just a reskinned version of **rrrocket**. If you want to do this yourself on your own local server, it's totally possible.

```
rrrocket parses a Rocket League replay file and outputs JSON.
```

Underneath rrrocket is the general rocket league parsing library: [boxcars](https://crates.io/crates/boxcars)

## Usage

Parses Rocket League replay files and outputs JSON with decoded information

```js
async function sendData(file) {
  const formData = new FormData();
  formData.append("replay", file, file.name);
  const res = await fetch(`https://rocketreplays.herokuapp.com/api/uploads`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  console.log(data);
}
```

## Output

A sample output of the JSON from rrrocket:

```json
{
  "header_size": 4768,
  "header_crc": 337843175,
  "major_version": 868,
  "minor_version": 12,
  "game_type": "TAGame.Replay_Soccar_TA",
  "properties": {
    "TeamSize": 3,
    "Team0Score": 5,
    "Team1Score": 2,
    "Goals": [
      {
        "PlayerName": "Cakeboss",
        "PlayerTeam": 1,
        "frame": 441
      },
      // all the goals
    ]
    // and many more properties
  }
```

If network parsed is enabled then an attribute (snipped) looks something like:
_(`https://rocketreplays.herokuapp.com/api/uploads?network=true`)_

```json
{
  "actor_id": 6,
  "stream_id": 51,
  "attribute": {
    "RigidBody": {
      "sleeping": true,
      "location": {
        "bias": 16384,
        "dx": 16384,
        "dy": 16384,
        "dz": 25658
      },
      "x": 1,
      "y": 1,
      "z": 1,
      "linear_velocity": null,
      "angular_velocity": null
    }
  }
}
```

## Backend

I use `const { spawn } = require("child_process");` to run a command line process of **rrrocket**. I push different arguments into the process based on the api query and output the json back to the client.

You can look at the [server.js](server.js) for more info on how I handle POST requests.

```js
const args = ["-p"];
const command = `${__dirname}/rrrocket`;

// check post url for network parse flag
const networkParse = req.url.includes("network=true");
if (networkParse) {
  args.push("-n");
}

// add the file path to the arguments
args.push(`${req.file.path}`);

// Spawn a new process with the rrrocket command and arguments
const rrrocketProcess = runCommand(command, args, {
  env: { ...process.env, NODE_ENV: "test" },
});

// Capture the output of the command
let output = "";
rrrocketProcess.stdout.on("data", (data) => {
  output += data.toString();
});

// Handle the completion of the command
rrrocketProcess.on("close", (code) => {
  if (code === 0) {
    // Send the output to the client
    res.status(201).send(output);

    // Delete the uploaded file
    fs.unlinkSync(req.file.path);
  } else {
    res.status(500).send({
      success: false,
      message: "Something went wrong",
    });
  }
});
```
