//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const fs = require('fs');
const md5 = require('md5');
var session = require('express-session');
var uid = require('rand-token').uid;
const app = express();
const cors = require('cors')

var corsOptions = {
  origin: '*',
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

mongoose.connect("mongodb+srv://admin-kartheek:rakshak@cluster0.tkugp.mongodb.net/RakshakDB",{useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: String,
  token:String,
  savedParams: Array
});

const User = mongoose.model("User",userSchema);
// 1st API
app.get("/campus/main/campusname",function(req,res){
  res.send({"campusname":["madras","delhi"]});
});

app.post("/campus/main/register",function(req,res){
  user = new User({
    username: req.body.username,
    email: req.body.email,
    password: md5(req.body.password),
    role: req.body.role,
    token:uid(16),
    savedParams: []
  });
  user.save();
  res.send({"message":"Registered successfully"});
});

app.get("/campus/main/logout",function(req,res){
  req.session.destroy();
  res.send({"message":"Successfully logged out"});
});
//2nd API
app.post("/campus/main/login",function(req,res){
  User.findOne({username: req.body.username},function(err, foundUser){
    if(err){
      res.send(err);
    }else if(!foundUser){
      res.send({
        "message": "Not Found"
      });
    }else if(foundUser.password === md5(req.body.password)){
      req.session.sessionId = foundUser.token;
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
//3rd API
app.get("/campus/simulation/policyplanner",function(req,res){
  if(!req.session.sessionId){
    res.send("login first");
  }else{
    fs.readFile('defaultData.json',function(err,data){
      res.send(JSON.parse(data));
    });
  }
});
// 4th API
app.get("/campus/simulation/initialization",function(req,res){
  if(!req.session.sessionId){
    res.send("login first");
  }else{
    fs.readFile('initialize_data_default.json',function(err,data){
      res.send(JSON.parse(data));
    });
  }
});
// 5th API
app.post("/campus/simulation/savesimulation", bodyParser.json() ,function(req,res){
  if(!req.session.sessionId){
    res.send("login first");
  }else{
    User.findOne({token: req.session.sessionId},function(err,foundUser){
      if(err){
        res.send(err);
      }else{
        if(foundUser){
          if(foundUser.savedParams.length === 10){
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

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
