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

mongoose.connect("mongodb+srv://admin-kartheek:rakshak@cluster0.tkugp.mongodb.net/RakshakDB",{useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: String,
  token:String,
  savedParams: Array
});

const campusSchema = new mongoose.Schema({
  campusname : String,
  buildings : Array,
  classes : Array
});

const User = mongoose.model("User",userSchema);

const Campus = mongoose.model("Campus",campusSchema);
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
  // Campus.findOne({campusname:req.body.campusname},function(err,foundCampus){
  //   if(err){
  //     console.log(err);
  //   }else{
  //     if(!foundCampus){
  //       campus = new Campus({
  //         campusname : req.body.campusname,
  //         buildings : [],
  //         classes : []
  //       });
  //       campus.save();
  //     }else{
  //       console.log("campus aldready exists");
  //     }
  //   }
  // });
  User.findOne({username: req.body.username},function(err, foundUser){
    if(err){
      res.send(err);
    }else if(!foundUser){
      res.send({
        "message": "Not Found"
      });
    }else if(foundUser.password === md5(req.body.password)){
      req.session.sessionId = foundUser.token;
      req.session.campusname = req.body.campusname;
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
      if(!err && foundUser){
        if(foundUser.savedParams.length === 10){
          res.send({"message":"Limit reached"});
        }else{
          foundUser.savedParams.push(req.body);
          foundUser.save(error => {if(error){console.log(error);}});
          res.send({"message":"Saved Successfully"});
        }
      }else{
        res.send({"message":"User not found"});
      }
    });
  }
});
// 6th API
app.get('/campus/simulation/savedsimulations',function(req,res){
  if(!req.session.sessionId){
    res.send("login first");
  }else{
    User.findOne({token:req.session.sessionId},function(err,foundUser){
      if(!err && foundUser){
        let arr_Sim = []
        for(let i = 0;i<foundUser.savedParams.length;i++){
          arr_Sim.push({"SimulationName":foundUser.savedParams[i].Simulation_Name,"Created_Date_Time":foundUser.savedParams[i].Simulation1});
        }
        res.send({"message":arr_Sim});
      }else{
        res.send({"message":"user not found."});
      }
    });
  }
});
// 7th API
app.delete('/campus/simulation/savedsimulations/delete',function(req,res){
  if(!req.session.sessionId){
    console.log("login first");
  }else{
    User.findOne({token:req.session.sessionId},function(err,foundUser){
      if(!err && foundUser){
        for(let i=0;i<foundUser.savedParams.length;i++){
          if(foundUser.savedParams[i].Simulation_Name === req.body.SimulationName){
            foundUser.savedParams.splice(i,1);
            break;
          }
        }
        foundUser.save(error => {if(error){console.log(error);}});
        res.send({"message":"Simulation deleted"});
      }else{
        res.send({"message":"user not found"});
      }
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

// app.post('/campus/masterdata/campusbuildings/addbuilding',function(req, res){
//   if(!req.session.sessionId){
//     res.send("Login first");
//   }else{
//     Campus.findOne({campusname:req.session.campusname},function(err,foundCampus){
//       if(err || !foundCampus){
//         res.send("campus not found");
//       }else{
//         foundCampus.buildings.push(req.body);
//         foundCampus.save();
//         res.send({"message":"saved successfully"});
//       }
//     });
//   }
// });
//
// app.get('/campus/masterdata/campusbuildings/viewdata',function(req, res){
//   if(!req.session.sessionId){
//     res.send("login first");
//   }else{
//     Campus.findOne({req.session.campusname},function(err,foundCampus){
//       if(!err && foundCampus){
//         for(let i = 0;i<foundCampus.buildings.length;i++){
//           if(req.body.ID === foundCampus.buildings[i].BuildingId){
//             res.send(foundCampus.buildings[i]);
//             break;
//           }
//         }
//       }else{
//         res.send("Campus not found");
//       }
//     });
//   }
// });

// app.get('/testpython',function(req, res){
//     const { spawn } = require('child_process');
//
//     const childPython = spawn('C:/Users/VAJRALA/anaconda3/envs/rakshakenv/python.exe',['test.py']);
//
//     childPython.stdout.on('data', (data) =>{
//         console.log(`stdout: ${data}`);
//     });
//
//     childPython.stderr.on('data', (data) =>{
//         console.error(`stderr: ${data}`);
//     });
//
//     childPython.on('close', (code) =>{
//         console.log(`child process exited with code ${code}`);
//     });
//     res.send("Code run succesfull");
// });

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
