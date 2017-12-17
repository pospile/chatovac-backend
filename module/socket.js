console.log("Running high-security socket-module");
var server = require('http').createServer();
var io = require('socket.io')(server);
var dbs = require("./dbs.js");

io.on('connection', function(socket){
    var user_logged = false;
    var user_id;

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



    socket.on("disconnect", function () {
        console.log("Socket-device just got offline");
    });

});
server.listen(config.io_port, function () {
    console.log("Socket.io api is running at localhost:"+config.io_port);
});

