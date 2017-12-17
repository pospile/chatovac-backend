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

app.post('/register', function (req, res) {

    var name = req.body.name;
    var pass = req.body.pass;
    var device_id = req.body.device_id;


    dbs.NewUser(name, pass, device_id, security, function (data) {
        console.log("New user has been registered.");
        res.json(data);
    });

});

app.post('/login', function (req, res) {

    var name = req.body.name;
    var pass = req.body.pass;
    var device_id = req.body.device_id;


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

});

app.post('/token', function (req, res) {

    var name = req.body.name;
    var token = req.body.pass;
    var device_id = req.body.device_id;

    dbs.CheckToken(name, token, device_id, function (data) {
       res.json(data);
    });

});


app.listen(config.rest_port, function () {
    console.log('rest api is running at localhost:3000!')
});