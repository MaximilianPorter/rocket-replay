# Rocket Replays

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
  // data must be named "replay"
  formData.append("replay", file, file.name);
  const res = await fetch(serverEndpoint, {
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
_endpoint: `rocketreplays.com/api/uploads?network=true`_

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
