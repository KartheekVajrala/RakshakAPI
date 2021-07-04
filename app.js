//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
var session = require('express-session');
var uid = require('rand-token').uid;
const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({secret: 'secret-key'}));
mongoose.connect("mongodb://localhost:27017/RakshakDB",{useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: String,
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
    role: req.body.role
  });
  user.save();
  res.send({"message":"Registered successfully"});
});

app.post("/campus/main/login",function(req,res){
  User.findOne({email: req.body.username},function(err, foundUser){
    if(err){
      res.send(err);
    }else if(!foundUser){
      res.send({
        "message": "Not Found"
      });
    }else if(foundUser.password === req.body.password){
      res.send({
        "message":"sucessfully logined",
         "token":foundUser.token,
         "role":foundUser.role
      });
    }
  });
});

// app.get("/",function(req,res){
//   res.sendFile(__dirname+"/index.html");
// });
//
// app.post("/",function(req,res){
//   console.log(req.body);
//   res.redirect("/");
// });

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
