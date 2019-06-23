const should = require("chai").should();
const websocket = require("../websocket.js");
const WebSocket = require("ws");
const moment = require("moment");

describe("websocket", function() {
    let ws = '';
    beforeEach((done) => {
        websocket.server.listen(7000)
        ws = new WebSocket("ws://127.0.0.1:7000");
        ws.on("open", () => {
            done();
        })
    })

    afterEach((done) => {
       websocket.server.close();
        ws.close();
        done()
    })

    it("should return an error about username", function() {
            ws.send(JSON.stringify({"username": "a"}));
            ws.on("message", (message) => {
                message.should.equal(JSON.stringify({"error":"username must be more than 2 characters, and less than 12 characters."}));
            })
    })

    it("should return username with color", function() {
            ws.send(JSON.stringify({"username": "penguin", "validate": "username"}));
            ws.on("message", function(message) {
                message.should.equal(JSON.stringify({"username": "penguin", "color": "#24f7ca"}));
            })
        })

    it("should return an error about username not existing", function() {
        let message_ = {"message": "Hello", "username": "penguin"}
        ws.send(JSON.stringify(message_));
        ws.on("message", function(message) {
            message.should.equal(JSON.stringify({"error":"username does not exist, or is not your actual username."}));
        })
    })

    it("should return the message", function() {
        ws.send(JSON.stringify({"username": "penguin", "skip": true}));// () => {
        ws.send(JSON.stringify({"message": "hello", "username": "penguin"}));
        ws.on("message", function(message) {
            message.should.equal(JSON.stringify({"message":"hello","username": "penguin","timestamp":websocket.getTime(), "color": "#24f7ca"}));
        })
    })

    it("should return an error about message being 0 characters", function() {
        ws.send(JSON.stringify({"username": "penguin", "skip": true}));
        ws.send(JSON.stringify({"message": "", "username": "penguin"}));
        ws.on("message", function(message) {
            message.should.equal(JSON.stringify({"error":"message can not be 0 characters."}));
        })
    })

    it("should return the userlist", function() {
        ws.send(JSON.stringify({"username": "penguin", "skip": true}));
        ws.send(JSON.stringify({"userlist": true}));
        ws.on("message", function(message) {
            message.should.equal(JSON.stringify({"userlist":[{"username":"penguin","color":"#24f7ca"}]}));
        })
    })

    it("should return an error about the username being taken", function() {
        ws.send(JSON.stringify({"username": "penguin", "skip": true}));
        ws.send(JSON.stringify({"username": "penguin"}));
        ws.on("message", function(message) {
            message.should.equal(JSON.stringify({"error": "username is already taken."}));
        })
    })
})
