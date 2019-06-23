$(() => {

    function requestUserlist(w) {
        w.send(JSON.stringify({"userlist": "true"}));
    }

    const ws = new WebSocket("ws://localhost:7000");
    let penguin = new Vue({
        el: "#penguin",
        data: {
            messages: [],
            username: "",
            usernameValid: false,
            color: "",
            userlist: [],
            error: "",
            usernameInput: "",
            messageInput: "",
        },
        methods: {
            sendMessage: () => {
                let message = $("#message").val();
                let data = {"username": penguin["username"], "message": message}
                ws.send(JSON.stringify(data));
                penguin["messageInput"] = "";
            },
            sendUsername: () => {
                let username = $("#username").val();
                penguin["usernameValid"] = true;
                ws.send(`{"username": "${username}"}`);
                penguin["usernameInput"] = "";
            }
        }
    })
    ws.onopen = (event) => {
        requestUserlist(ws);
    }
    ws.onmessage = (message) => {
        let data = JSON.parse(message["data"]);
        if (Object.keys(data).includes("userlist")) {
            if (data["userlist"].length > 0) {
                penguin["userlist"] = [];
                penguin["error"] = "";
                data["userlist"].forEach((user) => {
                    penguin["userlist"].push(user);
                });
            }
        }
        let data_keys = Object.keys(data);
        if (data_keys.includes("username") && !data_keys.includes("message")) {
            penguin["username"] = data["username"];
            penguin["color"] = data["color"];
            penguin["usernameValid"] = true;
            penguin["error"] = "";
            requestUserlist(ws);
        } else if (data_keys.includes("message") && data_keys.includes("username")) {
            penguin["messages"].push(data);
            penguin["error"] = "";
        } else if (data_keys.includes("error")) {
            penguin["error"] = data["error"];
        }

    };
});