console.log("Running high-security orm database module");
var orm = require('orm');
var moment = require('moment');
moment.locale("cs");




var Token = null;
var User = null;
var UserInChat = null;
var Chat = null;
var ChatLine = null;
var FriendShip = null;

var db = null;


orm.connectAsync('mysql://root:25791998@35.187.189.40/chatovac')
    .then(function(_db) {
       console.log("Connected successfully...");

       db = _db;

        /*DEFINITON OF EVERY SINGLE TABLE IN MYSQL DATABASE*/


        Chat = _db.define("tbChat", {
            id : {type: 'serial', key: true},
            name : String
        });
        UserInChat = _db.define("tbUserInChat", {
            id : {type: 'serial', key: true},
            user : Number,
            chat: Number
        });
        User = _db.define("tbUser", {
            id : {type: 'serial', key: true},
            user : String,
            pass: String //THIS IS BCRYPTED()
        });
        Token = _db.define("tbToken", {
            id : {type: 'serial', key: true},
            user : Number,
            token: String,
            valid_to: { type: "date", time: true },
            device_id: String
        });
        ChatLine = _db.define("tbChatLine", {
            id : {type: 'serial', key: true},
            text : String,
            time : { type: "date", time: true },
            user: Number,
            chat: Number
        });
        FriendShip = _db.define("tbFriendship", {
            id : {type: 'serial', key: true},
            user1: Number,
            user2: Number
        });

        /*
        var newRecord = {};
        var now = new Date();
        newRecord.startup = now;
        require('getmac').getMac(function(err,macAddress){
            if (err)  throw err
            console.log("Accessing database as: " + macAddress);
            newRecord.mac = macAddress;
            Log.createAsync(newRecord)
                .then(function(results) {
                    //console.log(results);
                    is_db_ready = true;
                    db = _db;
                });
        })
        */
    })
    .catch(function(err) {
        console.error('Connection error: ' + err);
    });


exports.NewUser = function (name, pass, device_id, security, callback) {
    security.EncryptPassword(pass, function (hash) {
        var user = {};
        user.user = name;
        user.pass = hash;
        User.createAsync(user).then(function (results) {
            console.log(results);
            security.GenerateToken(function (tkn) {
               var token = {};
               token.user = results.id;
               token.token = tkn;
               token.valid_to = new Date(moment().add(1, "M"));
               token.device_id = device_id;
               Token.createAsync(token).then(function (res) {
                   var ultm = {};
                   ultm.user = results;
                   ultm.token = res;
                   callback(ultm);
               });
            });
            /*
            security.GenerateToken(function (token) {

            });
            */
        })
    });
};
exports.LoginUser = function (name, pass, device_id, security, callback) {
    User.find({user: name}, function (err, user) {
        if (!err)
        {
            if (user.length > 0)
            {
                console.log(user);
                security.VerifyPassword(user[0].pass, pass, function (real)
                {
                    if (real)
                    {
                        console.log("Heslo se shoduje");
                        security.GenerateToken(function (tkn) {
                            var token = {};
                            token.user = user[0].id;
                            token.token = tkn;
                            token.valid_to = new Date(moment().add(1, "M"));
                            token.device_id = device_id;
                            Token.createAsync(token).then(function (res) {
                                var ultm = {};
                                ultm.user = user[0];
                                ultm.token = res;
                                callback(ultm);
                            });
                        });
                    }
                    else
                    {
                        console.log("Hesla se neshodují");
                        callback(false);
                    }
                });
            }
            else
            {
                console.log("user neexistuje");
                callback(false);
            }
        }
    });
};
exports.CheckToken = function (user, token, device_id, callback) {
    User.find({user: user}, function (err, user) {
        if (!err) {
            if (user.length > 0) {
                console.log(user);
                Token.find({user: user[0].id, token: token},function (err2, token) {
                    if (token.length > 0) {
                        console.log(token);

                        if (moment(token[0].valid_to) > moment())
                        {
                            console.log("token by měl být stále validní");
                            callback({valid: true, desc: "token will expire " + moment(token[0].valid_to).from(moment())});
                        }
                        else
                        {
                            console.log("tokenu již vypršela platnost, systém mu nebude důvěřovat");
                            callback({valid: false, desc: "Token has expired"});
                        }

                    }
                    else {
                        console.log("No token released, please log-in first");
                        callback({valid: false, desc: "No token available, invalid token, or user isn't logged."});
                    }
                });
            }
            else
            {
                console.log("No one with this name exist, therefore token not available");
                callback({valid: false, desc: "Invalid data"});
            }
        }
    });
};

exports.ConnectFriends = function (name1, name2, callback) {
    User.find({user: name1}, function (err, user1) {
        if (!err)
        {
            if (user1.length > 0)
            {
                User.find({user: name2}, function (err, user2) {
                    if (!err)
                    {
                        if (user2.length > 0)
                        {
                            console.log("Both users exists, connecting them together");
                            var friends = {};
                            friends.user1 = user1[0].id;
                            friends.user2 = user2[0].id;
                            FriendShip.createAsync(friends).then(function (friendship) {
                                var chat = {};
                                chat.name = user1[0].user + " a " + user2[0].user;
                                Chat.createAsync(chat).then(function (chat) {
                                    var user_in_chat = {};
                                    user_in_chat.user = user1[0].id;
                                    user_in_chat.chat = chat.id;
                                    UserInChat.createAsync(user_in_chat).then(function () {
                                        var user_in_chat2 = {};
                                        user_in_chat2.user = user2[0].id;
                                        user_in_chat2.chat = chat.id;
                                        UserInChat.createAsync(user_in_chat2).then(function (chat) {
                                            /*
                                            TODO:// TADY POTREBUJI PRIDAT JEDNU LAJNU DO NOVEHO CHATU
                                            */
                                            console.log(chat);
                                            var chatline = {};
                                            chatline.text = "Friendship created!";
                                            chatline.time = moment();
                                            chatline.user = user1[0].id;
                                            chatline.chat = chat.chat;
                                            ChatLine.createAsync(chatline).then(function (){
                                                callback(true);
                                                console.log("Friendship is completed and confirmed. Chat room is created");
                                            });
                                        }).catch(function (reason) {
                                            console.log(reason);
                                        });
                                    });
                                });
                            });
                        }
                        else
                        {
                            callback(false);
                        }
                    }
                });
            }
            else
            {
                callback(false);
            }
        }
    });
};

exports.GetChatsForUser = function (name, callback) {
    console.log("looking for user");
    User.find({user: name}, function (err, user) {
        console.log(user);
        if(user.length > 0)
        {
            console.log("account finded");
            UserInChat.find({user: user[0].id}, function (err, data) {
                console.log(data);
               if (data.length > 0)
               {
                   for(var i = 0; i < data.length; i++)
                   {
                        Chat.find({id: data[i].chat}, function (err2, chat) {
                            console.log("new chat has been found");
                            callback(chat[0]);
                        });
                   }
               }
            });
        }
        else
        {
            callback({valid:false, error: "No user with this name found"});
        }
    });
};

exports.GetChatsForUserAsync = function (name, callback) {
    console.log("looking for user");
    User.find({user: name}, function (err, user) {
        console.log(user);
        if(user.length > 0)
        {
            console.log("account finded");
            UserInChat.find({user: user[0].id}, function (err, data) {
                console.log(data);
                if (data.length > 0)
                {
                    var last = false;
                    var sended = 0;
                    for(var i = 0; i < data.length; i++)
                    {

                        Chat.find({id: data[i].chat}, function (err2, chat) {
                            if (sended === data.length-1)
                            {
                                last=true;
                                console.log("last one, sending result away.");
                            }
                            else
                            {
                                sended++;
                            }
                            console.log("new chat has been found");

                            callback(chat[0], last);
                        });
                    }
                }
                else
                {
                    callback({valid:false, error: "No user chat found"}, true);
                }
            });
        }
        else
        {
            callback({valid:false, error: "No user with this name found"}, true);
        }
    });
};


exports.GetAvatarForChat = function (chat_id, ignored_id, callback) {
    UserInChat.find({chat: chat_id}).order("-id").run(function (err, users) {
        users.forEach(function (value) {
            if (value.user !== ignored_id){

                //TODO:// REPLACE WITH RETURNING GRAVATAR URL!
                console.log(value);
            }
            else
            {
                console.log("ignored");
            }
        });
    });
};


exports.GetLastMsgForChat = function (chat_id, callback) {
    ChatLine.find({chat: chat_id}).order("-id").limit(1).run(function (err, msg) {
        if (msg != null){
            if (moment(msg[0].time).dayOfYear() === moment().dayOfYear())
            {
                msg[0].time =  moment(msg[0].time).hours() + ":" + moment(msg[0].time).minutes();
            }
            else
            {
                msg[0].time =  moment(msg[0].time).format("dddd [v]") + " " + moment(msg[0].time).hours() + ":" + moment(msg[0].time).minutes();
            }
            callback(msg);
        }
        else {
            callback(msg);
        }
        /*

        */

    });
};

exports.GetChatContent = function (chat_id, limit, offset, callback) {
    chat_id = parseInt(chat_id);
    limit = parseInt(limit);
    offset = parseInt(offset);
    console.log("getting chat with limit: " + limit + " offset:" + offset);
    ChatLine.find({chat: chat_id}, parseInt(limit), {offset:offset}, function (err, chat_line) {

            var i = 0;
            chat_line.forEach(function (value) {
               //value.time = moment(value).unix();
                chat_line[i].time = moment(chat_line[i].time).unix();
                if (i === chat_line.length-1)
                {
                    callback(chat_line);
                }
                i++;
            });
            if(chat_line.length > 0) {
                console.log("limit: " + limit + " vs: " + chat_line.length);

            }
            else
            {
                callback([]);
            }
    });
};

exports.SendChatMessage = function (chat_id, user, message, callback) {
    console.log("sending new message");
    console.log("searching for: " + user);
    User.find({user: user}, function (err, _user) {
        console.log(_user);
        var user_id = _user[0].id;

        UserInChat.find({user: user_id, chat: chat_id}, function (err, chtr) {
            if (chtr.length > 0)
            {
                var chat_line = {};
                chat_line.text = message;
                chat_line.time = new Date(moment());
                chat_line.user = user_id;
                chat_line.chat = chat_id;

                ChatLine.createAsync(chat_line).then(function (result) {
                    console.log(result);
                    callback(result);
                    require("./socket.js").SendNotification(chat_line, user);
                });
            }
            else
            {
                console.log("Chat is not available (does not exist)");
            }
        });
    });
};

exports.GetAllRegisteredUsers = function (callback) {
    db.driver.execQuery("SELECT id, user FROM tbUser", function (err, data) {
        console.log(data);
        callback(data);
    });
};

exports.GetAllFriends = function (id, callback) {
    db.driver.execQuery("SELECT * from tbFriendship fr where (fr.user1 = "+parseInt(id)+") || (fr.user2 = "+parseInt(id)+")", function (err, data) {
        console.log(data);
        callback(data);
    });
};

exports.GetFriendInfo = function (id, callback) {
    db.driver.execQuery("SELECT * from tbUser us where (us.id = "+parseInt(id)+")", function (err, data) {
        console.log(data);
        callback(data);
    });
};


var callbacks = {};
exports.RegisterChatListener = function (id, callback) {
    callbacks[id.toString()].push(callback);
    console.log(callbacks);
};
