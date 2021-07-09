//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const fs = require('fs');
var session = require('express-session');
var uid = require('rand-token').uid;
const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
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
  token:String
});

const User = mongoose.model("User",userSchema);

app.get("/campus/main/campusname",function(req,res){
  res.send({"campusname":["madras","delhi"]});
});

app.post("/campus/main/register",function(req,res){
  user = new User({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role,
    token:uid(16)
  });
  user.save();
  res.send({"message":"Registered successfully"});
});

app.get("/campus/main/logout",function(req,res){
  req.session.destroy();
  res.send({"message":"Successfully logged out"});
});

app.post("/campus/main/login",function(req,res){
  User.findOne({username: req.body.username},function(err, foundUser){
    if(err){
      res.send(err);
    }else if(!foundUser){
      res.send({
        "message": "Not Found"
      });
    }else if(foundUser.password === req.body.password){
      req.session.sessionId = foundUser.token;
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

app.get("/campus/simulation/initialization",function(req,res){
  if(!req.session.sessionId){
    res.send("login first");
  }else{
    fs.readFile('initialize_data_default.json',function(err,data){
      res.send(JSON.parse(data));
    });
  }
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
