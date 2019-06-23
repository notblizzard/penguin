const ws = require("ws");
const fs = require("fs");
const https = require("https");
const http = require("http");
const md5 = require("md5");
const uuid = require("uuid/v4");
const moment = require("moment");

let websockets = {};

let server = http.createServer();

const websocket = new ws.Server({server: server});


let getColor = websockets.getColor = function(username) {
    // get color of username using md5.
    return `#${md5(username).slice(0, 6)}`;
}

let getTime = websockets.getTime = function() {
    let time = moment();
    if (!time.isDST()) {
        time.add(1, "h")
    }
    return time.format("HH:mm:ss");
}

let getUserlist = websockets.getUserlist = function(clients) {
    // get usernames from websocket.
    let usernames = {"userlist": []};
    clients.forEach((user) => {
        if (user.hasOwnProperty("username") && user["inactive"] === false) {
            usernames["userlist"].push({"username": user["username"], "color": user["color"]})
        }
    })
    usernames["userlist"] = usernames["userlist"].sort((a, b) => a["username"].localeCompare(b["username"]));
    return usernames;
}

let getUsernames = function(clients, username) {
    let usernames = [];
    clients.forEach(user => usernames.push(user["username"]));
    if (usernames.includes(username)) {
        return true;
    }
    return false;
}
websocket.on("connection", (w) => {
    w.uuid = uuid();
    w.inactive = false;

    w.on("message", (message) => {
        message = JSON.parse(message);

        if (message.hasOwnProperty("username") && !message.hasOwnProperty("message")) {
            // Updating Username
            if (message["username"].length < 2 || message["username"].length > 12) {
                // Username is not valid
                return w.send(JSON.stringify({"error": "username must be more than 2 characters, and less than 12 characters."}));
            }
            if (getUsernames(websocket.clients, message["username"])) {
                return w.send(JSON.stringify({"error": "username is already taken."}));
            }
            w.username = message["username"];
            w.color = getColor(w["username"]);
            if (!message.hasOwnProperty("skip")) {
               w.send(JSON.stringify({"username": w["username"], "color": w["color"]}));
            }
        }

        if (message.hasOwnProperty("message")) {
            // New Message
            if ((message["username"] !== w["username"]) || w["username"] == "") {
                return w.send(JSON.stringify({"error": "username does not exist, or is not your actual username."}));
            }

            if (message["message"].trim().length === 0) {
                return w.send(JSON.stringify({"error": "message can not be 0 characters."}));
            }
            message["timestamp"] = getTime();
            message["color"] = getColor(message["username"]);
            message = JSON.stringify(message);
            websocket.clients.forEach((user) => {
                user.send(message);
            });
        }

        if (message.hasOwnProperty("userlist")) {
            let userlist = getUserlist(websocket.clients);
            websocket.clients.forEach((user) => {
                user.send(JSON.stringify(userlist));
            });
        }
    })

    w.on("close", (close, reason) => {
        w.uuid = "";
        w.inactive = true;
        let userlist = getUserlist(websocket.clients);
        websocket.clients.forEach((user) => {
           user.send(JSON.stringify(userlist));
       });
    });
});

websockets.server = server;
module.exports = websockets;
