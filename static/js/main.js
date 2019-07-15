$(() => {
    function requestUserlist(w) {
        w.send(JSON.stringify({ userlist: "true" }));
    }

    const ws = new WebSocket("ws://localhost:7000");
    const penguin = new Vue({
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
                const data = { username: penguin.username, message: $("#message").val() };
                ws.send(JSON.stringify(data));
                penguin.messageInput = "";
            },
            sendUsername: () => {
                const username = $("#username").val();
                penguin.usernameValid = true;
                ws.send(`{"username": "${username}"}`);
                penguin.usernameInput = "";
            },
        },
    });
    ws.onopen = () => {
        requestUserlist(ws);
    };
    ws.onmessage = (message) => {
        const data = JSON.parse(message.data);
        if (Object.keys(data).includes("userlist")) {
            if (data.userlist.length > 0) {
                penguin.userlist = [];
                penguin.error = "";
                data.userlist.forEach((user) => {
                    penguin.userlist.push(user);
                });
            }
        }
        const keys = Object.keys(data);
        if (keys.includes("username") && !keys.includes("message")) {
            penguin.username = data.username;
            penguin.color = data.color;
            penguin.usernameValid = true;
            penguin.error = "";
            requestUserlist(ws);
        } else if (keys.includes("message") && keys.includes("username")) {
            penguin.messages.push(data);
            penguin.error = "";
        } else if (keys.includes("error")) {
            penguin.error = data.error;
        }
    };
});
