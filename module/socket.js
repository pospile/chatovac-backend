console.log("Running high-security socket-module");
var server = require('http').createServer();
var io = require('socket.io')(server);
var dbs = require("./dbs.js");

io.on('connection', function(socket){
    var user_logged = false;
    var user_id;
    var receive_realtime_messages;

    console.log("New socket-connection received starting timer");
    setTimeout(function () {
        if (!user_logged && config.advance_security_package){
            console.log("User wasn't able to log-in for two seconds, removing connection");
            socket.disconnect();
        }
        else {
            if (config.advance_security_package)
            {
                console.log("User logged-in JIT");
            }
            else
            {
                console.warn("Advance security package is disabled, this may be possible vulnerability!");
            }
        }
    }, 2000);


    socket.on("login", function (data) {
        console.log("Přihlašuji");
        console.log(data);

        if (data.token !== undefined || data.name !== undefined || data.device_id !== undefined){
            dbs.CheckToken(data.name, data.token, data.device_id, function (data) {
                console.log(data);
                if (data.valid)
                {
                    socket.emit("login_resp", data);
                    user_logged = true;
                }
                else
                {
                    data.security = "Your connection has been removed from security reasons.";
                    socket.emit("login_resp", data);
                    socket.disconnect();
                }
            });
        }
    });



    socket.on("friend_request", function (data) {
        dbs.ConnectFriends(data.user1, data.user2, function (data) {
           if (data){
               console.log("Friendship confirmed");
               socket.emit("friend_request_response", {valid: true});
           }
           else {
               console.log("Friendship cannot be established");
               socket.emit("friend_request_response", {valid: false});
           }
        });
    });


    socket.on("chats", function (data) {
        console.log("loading chats");
        dbs.GetChatsForUser(data.name, function (data) {
           console.log(data);
           socket.emit("chats_resp", data);
        });
    });

    socket.on("chat", function (data) {
       dbs.GetChatContent(data.chat_id, data.limit, data.offset, function (data) {
          socket.emit("chat_resp", data);
       });
    });

    socket.on("text_message", function (data) {
       dbs.SendChatMessage(data.chat_id, data.name, data.message, function (data) {
          socket.emit("text_message_resp", data);
       });
    });

    socket.on("disconnect", function () {
        console.log("Socket-device just got offline");
    });

    socket.on("notification_resp", function (data) {
       console.log("Receiving response for notification, not sending push");
       console.log(data);
       for (var i = 0; i < que.length; i++) {
           que[i].id == data.id;
           que.splice(i, 1);
       };
    });

});
server.listen(config.io_port, function () {
    console.log("Socket.io api is running at localhost:"+config.io_port);
});

var que = [];

exports.SendNotification = function (message, user) {
    console.log("sending notification" + message.text);
    message.user_name = user;
    que.push(message);
};

setInterval(function (msg) {
    //console.log("Running notification check");
    if (que.length > 0)
    {
        if (que[0].pushed == undefined){
            console.log("check successfull");
            que[0].pushed = true;
            io.emit("notification", que[0]);
        }
        else {
            console.log("Sending as push notification");
            //oneSignal.createNotification("Ahoj :)", {}, ["All"]);
            console.log(que[0]);
            var message = {
                app_id: "cf8e72ca-41a9-4025-99fc-f83a6ba94435",
                contents: {"en": que[0].text},
                headings: {"en": "From: " + que[0].user_name},
                data: {"id": "123"},
                included_segments: ["All"]
            };

            sendNotification(message);
            que.splice(0, 1);
        }

    }
}, 1000, 1000);


var sendNotification = function(data) {
    var headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": "Basic ZDFlODEwNzgtZmM2ZC00MDA0LTlmYTctZjg5MmJkY2E5Yjg5"
    };

    var options = {
        host: "onesignal.com",
        port: 443,
        path: "/api/v1/notifications",
        method: "POST",
        headers: headers
    };

    var https = require('https');
    var req = https.request(options, function(res) {
        res.on('data', function(data) {
            console.log("Response:");
            console.log(JSON.parse(data));
        });
    });

    req.on('error', function(e) {
        console.log("ERROR:");
        console.log(e);
    });

    req.write(JSON.stringify(data));
    req.end();
};


