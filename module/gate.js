var express = require('express');
var app = express();
var security = require("./security.js");
var dbs = require("./dbs.js");
var socket = require("./socket.js");



app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    /*console.log(req);*/
    next();
});


var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.get('/', function (req, res) {
    res.json({"status": "running", "version": 0.2});
});

app.post('/user/register', function (req, res) {

    var name = req.body.name;
    var pass = req.body.pass;
    var device_id = req.body.device_id;


    if (device_id === undefined || name === undefined || pass == undefined)
    {
        res.json({error: true, desc: "Invalid post data, name, pass, device_id required."});
    }
    dbs.NewUser(name, pass, device_id, security, function (data) {
        console.log("New user has been registered.");
        res.json(data);
    });

});

app.post('/user/login', function (req, res) {

    var name = req.body.name;
    var pass = req.body.pass;
    var device_id = req.body.device_id;

    if (device_id === undefined || name === undefined || pass == undefined)
    {
        res.json({error: true, desc: "Invalid post data, name, pass, device_id required."});
    }
    else
    {
        dbs.LoginUser(name, pass, device_id, security, function (data) {
            if (data != false)
            {
                res.json(data);
            }
            else
            {
                res.json({error: true, desc: "Invalid user, password or both"});
            }
        });
    }

});

app.post('/user/token', function (req, res) {

    var name = req.body.name;
    var token = req.body.token;
    var device_id = req.body.device_id;

    if (device_id === undefined || name === undefined || token == undefined)
    {
        res.json({error: true, desc: "Invalid post data, name, token, device_id required."});
    }

    dbs.CheckToken(name, token, device_id, function (data) {
       res.json(data);
    });

});

app.post('/chat/get', function (req, res) {

    var name = req.body.name;
    var token = req.body.token;


    var result = [];
    console.log("loading chats");
    dbs.GetChatsForUserAsync(name, function (data, send) {
        console.log(data);
        result.push(data);
        if (send)
        {
            res.json(result);
        }
    });
});

app.post('/chat/get/last', function (req, res) {

    var chat_id = req.body.chat_id;
    var token = req.body.token;

    console.log("Sending back last message");

   dbs.GetLastMsgForChat(chat_id, function (data) {
      res.json(data);
   });
});

app.post('/chat/get/id', function (req, res) {

    var chat_id = req.body.chat_id;
    var limit = req.body.limit;
    var offset = req.body.offset;
    var token = req.body.token;

    console.log("Sending back messages");

    dbs.GetChatContent(chat_id, limit, offset, function (data) {
        res.json(data);
    });

});




app.listen(config.rest_port, function () {
    console.log('rest api is running at localhost:3000!')
});