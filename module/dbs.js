var orm = require('orm');


var is_db_ready = false;
var db = null;

var Log = null;
var Job = null;
var Company = null;
var Notification = null;
var Driver = null;
var DriverPosition = null;
var Inactive = null;


orm.connectAsync('mysql://root:25791998@35.187.189.40/chatovac')
    .then(function(_db) {
       console.log("Connected successfully...");


        /*DEFINITON OF EVERY SINGLE TABLE IN MYSQL DATABASE*/
        Log = _db.define("tbLog", {
            startup : { type: "date", time: true },
            mac : String,
            log: String
        });

        Job = _db.define("tbJob", {
            id : {type: 'serial', key: true},
            name : String,
            description: String,
            start: String,
            target: String,
            company: Number,
            active: Number,
            assigned: Number
        });
        Company = _db.define("tbCompany", {
            id: {type: 'serial', key: true},
            name: String,
            domain: String
        });
        Notification = _db.define("tbNotification", {
            id: {type: 'serial', key: true},
            title: String,
            description: String,
            importance: Number,
            send_to: String
        });
        Driver = _db.define("tbDriver", {
            id: {type: 'serial', key: true},
            company: Number,
            phone_id: String,
            pin_lock: Number,
            last_online: { type: "date", time: true },
            first_name: String,
            last_name: String,
            car: String
        });
        DriverPosition = _db.define("tbDriverPosition", {
            id: {type: 'serial', key: true},
            latitude: Number,
            longtitude: Number,
            adress: String,
            driver_id: Number
        });
        Inactive = _db.define("tbInactive", {
           id: {type: 'serial', key: true},
            phone_id: String,
            active: Number
        });

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
    })
    .catch(function(err) {
        console.error('Connection error: ' + err);
    });


var NewJob = function (name, desc, company, start, end, callback) {
    if(!is_db_ready){callback(false);return;}

    console.log("Stopiji proměnou::!:" + end);

    var job = {};
    job.name = name;
    job.description = desc;
    job.company = company;
    job.start = start;
    job.target = end;



    Job.createAsync(job)
        .then(function (results) {
            console.log(results);
            callback(job);
        });
};
var LoadJobs = function (callback) {
  Job.find({}, function (err, jobs) {
      callback(jobs);
  });
};
var FindDriverById = function (phone_id, callback) {
    if(!is_db_ready){callback(false);return;}
    Driver.find({ phone_id: phone_id }, function (err, driver) {
        // SQL: "SELECT * FROM person WHERE surname = 'Doe'"
        if (err) throw err;

        console.log("Drivers found: %d", driver.length);
        if (driver.length == 0) {
            console.log("Pravděpodobný pokus o napadení!!!");
            var newRecord = {};
            var now = new Date();
            newRecord.startup = now;
            require('getmac').getMac(function(err,macAddress){
                if (err)  throw err
                console.log("Accessing database as: " + macAddress);
                newRecord.mac = macAddress;
                newRecord.log = "ERROR: Possible breach -> trying to log with unidentified device.";
                Log.createAsync(newRecord)
                    .then(function(results) {
                        callback(false);
                    });
            });
        }
        else
        {
            callback(driver[0]);
        }
    });
};
var AddInactiveUser = function (phone_id, callback) {
    var newRecord = {};
    newRecord.phone_id = phone_id;
    newRecord.active = 0;
    Inactive.find({phone_id: phone_id}, function (err, inactive) {
        if(inactive.length == 0)
        {
            Inactive.createAsync(newRecord)
                .then(function(results) {
                    callback(true);
                });
        }
        else {
            console.log("possible breach again (ddos included).");
            callback(false);
        }
    });

};
var GetAllInactives = function (callback) {
    Inactive.find({active: 0}, function (err, inactives) {
        console.log(inactives);
        if(inactives.length != 0)
        {
            callback(inactives);
        }
        else
        {
            callback(false);
        }
    })
};
var ActivateUser = function (data) {
    Driver.createAsync(data)
        .then(function(results) {


            Inactive.find({phone_id: data.phone_id}, function (err, inactive) {
                // SQL: "SELECT * FROM person WHERE surname = 'Doe'"
                if (err) throw err;

                console.log("People found: %d", inactive.length);

                inactive[0].active = 1;
                inactive[0].save(function (err) {
                    // err.msg = "under-age";
                });
            });

            /*
            Inactive.find({phone_id: data.phone_id}, function (err, inactive) {
                console.log(inactive);
               inactive[0].active = 1;
               inactive[0].save(function (data) {
                    console.log("Inaktivní zařízení převedeno na řidiče.");
               });
            });
            */
        });
};


exports.CreateNewJob = NewJob;
exports.LoadJobs = LoadJobs;
exports.FindDriverById = FindDriverById;
exports.AddInactiveUser = AddInactiveUser;
exports.GetAllInactives = GetAllInactives;
exports.ActivateUser = ActivateUser;
exports.NewJob = NewJob;




/* -- přidá novou company --
var Person = db.define("tbCompany", {
    name : String,
    domain: String,
    id: {type: 'serial', key: true}
});
var newRecord = {};
newRecord.name = "Vojta Taxi";

Person.createAsync(newRecord)
    .then(function(results) {
        console.log(results);
    });
*/

/* -- přidá nový job do databáze


var job = {};
job.name = "Testovací job";
job.description = "Testovací popisek jobu";
job.company = 1;
Job.createAsync(job)
    .then(function (results) {
        console.log(results);
    });


*/

/*

Types

The supported types are:

text: A text string;
number: A floating point number. You can specify size: 2|4|8.
integer: An integer. You can specify size: 2|4|8.
boolean: A true/false value;
date: A date object. You can specify time: true
enum: A value from a list of possible values;
object: A JSON object;
point: A N-dimensional point (not generally supported);
binary: Binary data.
serial: Auto-incrementing integer. Used for primary keys.
Each type can have additional options. Here's a model definition using most of them:

var Person = db.define("person", {
    id      : {type: 'serial', key: true},
	name    : { type: "text", size: 50 },
	surname : { type: "text", defaultValue: "Doe" },
	male    : { type: "boolean" },
	vat     : { type: "integer", unique: true },
	country : { type: "enum", values: [ "USA", "Canada", "Rest of the World" ] },
	birth   : { type: "date", time: false }
});


*/