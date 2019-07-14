const express = require("express");
const chalk = require("chalk");
const websocket = require("./websocket.js");
const fs = require("fs");
const yaml = require("js-yaml");

const app = express();

const data = yaml.safeLoad(fs.readFileSync("./config.yaml", "utf-8"))["penguin"];
const port = data["website"] || process.env.WEBSITE_PORT;
const websocketPort = data["websocket"] || process.env.WEBSOCKET_PORT;

app.use(express.static("dist"));
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/static/views/home.html");
})

app.listen(port, () => console.log(`website is now running on port ${chalk.blue(port)}.`));
websocket.server.listen(websocketPort, () => console.log(`websocket is now running on port ${chalk.blue(websocketPort)}.`));
