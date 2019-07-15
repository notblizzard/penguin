const ws = require("ws");
const http = require("http");
const md5 = require("md5");
const uuid = require("uuid/v4");
const moment = require("moment");

const websockets = {};
const server = http.createServer();
const websocket = new ws.Server({ server });


websockets.getColor = function getColor(username) {
    // get color of username using md5.
    return `#${md5(username).slice(0, 6)}`;
};

websockets.getTime = function getTime() {
    const time = moment();
    if (!time.isDST()) {
        time.add(1, "h");
    }
    return time.format("HH:mm:ss");
};

websockets.getUserlist = function getUserlist(clients) {
    // get usernames from websocket.
    const usernames = { userlist: [] };
    clients.forEach((user) => {
        if ({}.hasOwnProperty.call(user, "username") && user.username === false) {
            usernames.userlist.push({ username: user.username, color: user.color });
        }
    });
    usernames.userlist = usernames.userlist.sort((a, b) => a.username.localeCompare(b.username));
    return usernames;
};

function getUsernames(clients, username) {
    const usernames = [];
    clients.forEach(user => usernames.push(user.username));
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
        if ({}.hasOwnProperty.call(message, "username") && !{}.hasOwnProperty.call(message, "message")) {
            // Updating Username
            if (message.username.length < 2 || message.username.length > 12) {
                // Username is not valid
                return w.send(JSON.stringify({ error: "username must be more than 2 characters, and less than 12 characters." }));
            }
            if (getUsernames(websocket.clients, message.username)) {
                return w.send(JSON.stringify({ error: "username is already taken." }));
            }
            w.username = message.username;
            w.color = websockets.getColor(w.username);
            if (!{}.hasOwnProperty.call(message, "skip")) {
                w.send(JSON.stringify({ username: w.username, color: w.color }));
            }
        }

        if ({}.hasOwnProperty.call(message, "message")) {
            // New Message
            if ((message.username !== w.username) || w.username === "") {
                return w.send(JSON.stringify({ error: "username does not exist, or is not your actual username." }));
            }

            if (message.message.trim().length === 0) {
                return w.send(JSON.stringify({ error: "message can not be 0 characters." }));
            }
            message.timestamp = websockets.getTime();
            message.color = websockets.getColor(message.username);
            message = JSON.stringify(message);
            websocket.clients.forEach((user) => {
                user.send(message);
            });
        }

        if ({}.hasOwnProperty.call(message, "userlist")) {
            const userlist = websockets.getUserlist(websocket.clients);
            websocket.clients.forEach((user) => {
                user.send(JSON.stringify(userlist));
            });
        }
        return true;
    });

    w.on("close", () => {
        w.uuid = "";
        w.inactive = true;
        const userlist = websockets.getUserlist(websocket.clients);
        websocket.clients.forEach((user) => {
            user.send(JSON.stringify(userlist));
        });
    });
});

websockets.server = server;
module.exports = websockets;
