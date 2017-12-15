var express = require('express');
const notifier = require('node-notifier');
var app = express();

var requestIp = require('request-ip');

// inside middleware handler
var ipMiddleware = function(req, res, next) {
    var clientIp = requestIp.getClientIp(req); // on localhost > 127.0.0.1
    console.log(clientIp);
    next();
};

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

app.use(function(req, res, next) {
    console.log("request");
    ipMiddleware(req,res,next);
});

app.get('/', function (req, res) {
    res.json({"status": "ok"});
});

app.post('/', function (req, res) {
    var id = req.body.id;
    var token = req.body.token;

    require(appRoot + "/modules/api/security.js").CheckToken(token, id, function (data) {
        if (data)
        {
            res.json({"status": "ok", "authorized": true});
        }
        else
        {
            res.json({"error": true, "desc": "invalid token"});
        }
    })

});

app.post('/devices', function (req, res) {
    var id = req.body.id;
    var token = req.body.token;

    require(appRoot + "/modules/api/security.js").CheckToken(token, id, function (data) {
        if (data)
        {
            require(appRoot+"/modules/database.js").GetDbEngine(function (db) {
                db.RawQuery("select d.*, dg.name as 'group' from tbDevice d inner join tbDevicesGroups dsg on dsg.device_id = d.id inner join tbDeviceGroup dg on dsg.group_id = dg.id", function (data) {
                    if (data.length != 0)
                    {
                        console.log(data);
                        res.json(data);
                    }
                });
            });
        }
        else
        {
            res.json({"error": true, "desc": "invalid token"});
        }
    })

});

app.post('/locations', function (req, res) {
    var id = req.body.id;
    var token = req.body.token;

    require(appRoot + "/modules/api/security.js").CheckToken(token, id, function (data) {
        if (data)
        {
            require(appRoot+"/modules/database.js").GetDbEngine(function (db) {
                db.SelectFrom("tbBackupLocation", "*", null, null, function (data) {
                    res.json(data);
                });
            });
        }
        else
        {
            res.json({"error": true, "desc": "invalid token"});
        }
    })

});

app.post('/clients', function (req, res) {
    var id = req.body.id;
    var token = req.body.token;

    require(appRoot + "/modules/api/security.js").CheckToken(token, id, function (data) {
        if (data)
        {
            var data = {};
            for (var i = 0; i < clients.length; i++)
            {
                data[i] = clients[i].id
            }
            res.json(data);
        }
        else
        {
            res.json({"error": true, "desc": "invalid token"});
        }
    })

});

app.post('/clients/backup', function (req, res) {
    var id = req.body.id;
    var token = req.body.token;
    var path = req.body.path;

    if (path == undefined) {res.json({"done": false, "error": true});return;}
    if (path == null) {res.json({"done": false, "error": true});return;}

    require(appRoot + "/modules/api/security.js").CheckToken(token, id, function (data) {
        if (data)
        {
            var data = {};
            for (var i = 0; i < clients.length; i++)
            {
                data[i] = clients[i].emit('backup', { path: path, "type": "ftp", url: "lacicloud.net", login: "android", pass: "123456a+" });
            }
            res.json({"done": true, "error": false});
        }
        else
        {
            res.json({"error": true, "desc": "invalid token"});
        }
    })

});

app.post('/clients/structure', function (req, res) {
    var id = req.body.id;
    var token = req.body.token;
    var path = req.body.path;

    if (path == undefined) {res.json({"done": false, "error": true});return;}
    if (path == null) {res.json({"done": false, "error": true});return;}

    require(appRoot + "/modules/api/security.js").CheckToken(token, id, function (data) {
        if (data)
        {
            if (clients.length == 0) {res.json({"done": false, "error": true, "description": "no device able to respond"});return;}
            var data = {};
            send = true;
            for (var i = 0; i < clients.length; i++)
            {
                data[i] = clients[i].emit('path', { "path": path, request: "ID:00"+i });
                var send = true;
                clients[i].on("path", function(data){
                    console.log("Reaguji na prvního kdo mi odeslal tuto strukturu");
                    console.log(data.structure);
                    if (send) {res.json(data.structure); send = false;}
                });
            }

        }
        else
        {
            console.log("Error piče");
            res.json({"error": true, "desc": "invalid token"});
        }
    })
});


app.post('/clients/profiles', function (req, res) {
    var id = req.body.id;
    var token = req.body.token;

    require(appRoot + "/modules/api/security.js").CheckToken(token, id, function (data) {
        if (data)
        {
            if (clients.length == 0) {res.json({"done": false, "error": true, "description": "no device able to respond"});return;}
            var data = {};
            send = true;
            for (var i = 0; i < clients.length; i++)
            {
                data[i] = clients[i].emit('path', { "profile": path, request: "ID:01"+i });
                var send = true;
                clients[i].on("profile", function(data){

                });
            }

        }
        else
        {
            console.log("Error piče");
            res.json({"error": true, "desc": "invalid token"});
        }
    })

});


app.post('/locations/new', function (req, res) {
    var id = req.body.id;
    var token = req.body.token;

    var name = req.body.name;
    var url = req.body.url;
    var user = req.body.user;
    var pass = req.body.pass;

    require(appRoot + "/modules/api/security.js").CheckToken(token, id, function (data) {
        if (data)
        {
            require(appRoot+"/modules/database.js").GetDbEngine(function (db) {
                db.InsertInto("tbBackupLocation", ["name", "url", "login", "pass"], [name, url, user, pass], function (data) {
                    res.json({"error": false, "done": true});
                });
            });
        }
        else
        {
            res.json({"error": true, "desc": "invalid token"});
        }
    })
});

app.post('/check',function(req,res) {
    var token = req.body.token;
    require(appRoot+"/modules/database.js").GetDbEngine(function (db) {
        db.SelectFrom("tbToken", "*", null, "where token='"+token+"'", function (data) {
            console.log(data);
            if(data.length != 0)
            {
                res.json({"valid": true, "token": token});
            }
            else
            {
                res.json({"valid": false, "token": token});
            }
        });
    });

});

app.post('/auth',function(req,res){
    var username	=	req.body.user;
    var pass	    =	req.body.pass;
    var id          =   req.body.id;

    if (username != undefined && pass != undefined && username != null && pass != null && id != undefined && id != null)
    {
        console.log("Request web for auth");
        console.log(username + " on device: " + id);
        require(appRoot + "/modules/database.js").GetDbEngine(function (db) {
            db.SelectFrom("tbUzivatel", "*", null, "where name='"+username+"'", function (data) {
                console.log(data);
                var user_id = data[0].id;
                console.log("USer id: " + user_id);
                require(appRoot+"/modules/api/security.js").CheckHashForUser(pass, data[0].pass, function (check) {
                    if (check)
                    {
                        console.log("sedí");
                        var expiry = new Date();
                        expiry.setDate(expiry.getDate() + 30);
                        require(appRoot+"/modules/api/security.js").GenerateTokenFromID(id, Date.parse(expiry), function (data) {
                            require(appRoot + "/modules/database.js").GetDbEngine(function (db) {
                                db.InsertInto("tbToken", ["token", "user_id", "expiration"], [data+"", user_id, expiry+""], function (result) {
                                    res.json({
                                        "error": false,
                                        "token": data,
                                        "expire": expiry,
                                        "issued_for": user_id,
                                        "issued_by": require(appRoot + "/config.json").server_id
                                    });
                                    console.log(result);
                                });
                            });
                        });
                    }
                    else
                    {
                        console.log("nesedí");
                        res.json({"error": true, "token": "invalid data in request"});
                    }
                });
            });
        });
    }
    else
    {
        console.log("Invalid request for web auth");
        res.json({"error": true, "token": "invalid post request"});
    }
});

app.listen(3000, function () {
    console.log('rest api is running at localhost:3000!')
    notifier.notify({
        'title': 'Rest api active',
        'message': 'New api created and activated'
    });
});