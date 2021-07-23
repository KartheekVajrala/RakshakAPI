//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const fs = require('fs');
var session = require('express-session');
var uid = require('rand-token').uid;
const app = express();
const cors = require('cors')

var corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use(session({
    secret : 'secret-key',
    resave :false,
    saveUninitialized: true,

}));

mongoose.connect("mongodb://localhost:27017/RakshakDB",{useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: String,
  token:String,
  savedParams: Array,
});

const campusSchema = new mongoose.Schema({
  campusname : String,
  buildings : Array,
  classes : Array
});

const User = mongoose.model("User",userSchema);

const Campus = mongoose.model("Campus",campusSchema);

app.get("/campus/main/campusname",function(req,res){
  res.send({"campusname":["madras","delhi"]});
});

app.post("/campus/main/register",function(req,res){
  user = new User({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role,
    token: uid(16),
    savedParams: [],
  });
  user.save();
  res.send({"message":"Registered successfully"});
});

app.get("/campus/main/logout",function(req,res){
  req.session.destroy();
  res.send({"message":"Successfully logged out"});
});

app.post("/campus/main/login",function(req,res){
  console.log(req.body);
  Campus.findOne({campusname:req.body.campusname},function(err,foundCampus){
    if(err){
      console.log(err);
    }else{
      if(!foundCampus){
        campus = new Campus({
          campusname : req.body.campusname,
          buildings : [],
          classes : []
        });
        campus.save();
        console.log("campus saved");
      }else{
        console.log("campus aldready exists");
      }
    }
  });
  User.findOne({username: req.body.username},function(err, foundUser){
    if(err){
      res.send(err);
    }else if(!foundUser){
      res.send({
        "message": "Not Found"
      });
    }else if(foundUser.password === req.body.password){
      req.session.sessionId = foundUser.token;
      req.session.campusname = req.body.campusname;
      console.log(req.session);
      res.send({
        "message":"sucessfully logged in",
         "token":foundUser.token,
         "role":foundUser.role
      });
    }
  });
});

app.get("/campus/main/dashboard",function(req,res){
  if(!req.session.sessionId){
    res.send("login first");
  }else{
    User.findOne({token:req.session.sessionId},function(err, foundUser){
      if(!err && foundUser){
        res.send("you are "+foundUser.username);
      }else{
        res.send("session not found.");
      }
    });
  }
});

app.get("/campus/simulation/policyplanner",function(req,res){
  if(!req.session.sessionId){
    res.send("login first");
  }else{
    fs.readFile('defaultData.json',function(err,data){
      res.send(JSON.parse(data));
    });
  }
});

app.get("/campus/simulation/initialization", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
		fs.readFile("initialize_data_default.json", function (err, data) {
			res.send(JSON.parse(data));
		});
	}
});

app.get("/campus/campussimulator/visualpanel/peoplecount", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    res.send({
      "HealthyPeople":Math.floor(Math.random() * 500) + 1500,
      "Asymptomatic":Math.floor(Math.random() * 20) + 5,
      "Symptomatic":Math.floor(Math.random() * 10) + 3,
      "Recovered":Math.floor(Math.random() * 30) + 7,
      "Vaccinated":Math.floor(Math.random() * 100) + 20,
      "Deceased":Math.floor(Math.random() * 5)
     });
  }
});

app.post("/campus/simulation/savesimulation", bodyParser.json() ,function(req,res){
  if(!req.session.sessionId){
    res.send("login first");
  }else{
    User.findOne({token: req.session.sessionId},function(err,foundUser){
      if(err){
        res.send(err);
      }else{
        if(foundUser){
          if(foundUser.savedParams.length === 2){
            res.send({"message":"limit reached"});
          }else{
            User.findOneAndUpdate({token: req.session.sessionId},{$push : {savedParams : req.body}},function(err,success){
              if(err){
                  res.send(err);
                }else{
                  res.send({"Message": "Saved Successfully"});
                }
            });
          }
        }
      }
    });
  }
});
//15th API
app.post("/campus/masterdata/campusbuildings/addbuilding", bodyParser.json() ,function(req,res){
  if(!req.session.sessionId){
    res.send("login first");
  }else{
    Campus.findOne({campusname:req.session.campusname},function(err,foundCampus){
      if(err){
        res.send(err);
      }else{
        if(foundCampus){
          if(foundCampus.buildings.length === 10){
            res.send({"message":"limit reached"});
          }else{
            foundCampus.buildings.push(req.body);
            foundCampus.save();
            res.send({"message":"Saved Successfully"});
          }
        }
      }
    });
  }
});
//16th API
app.delete('/campus/masterdata/campusbuildings/deletebuilding',function(req,res){
  if(!req.session.sessionId){
    console.log("login first");
  }else{
    Campus.findOne({campusname:req.session.campusname},function(err,foundCampus){
      if(!err && foundCampus){
        for(let i=0;i<foundCampus.buildings.length;i++){
          if(foundCampus.buildings[i].BuildingId === req.body.BuildingId){
            foundCampus.buildings.splice(i,1);
            break;
          }
        }
        foundCampus.save(error => {if(error){console.log(error);}});
        res.send({"message":"Building deleted successfully"});
      }else{
        res.send({"message":"Campus not found"});
      }
    });
  }
});
app.listen(3000, function() {
  console.log("Server started on port 3000");
});
