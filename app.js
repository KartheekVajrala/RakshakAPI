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
  ID: Number,
  Fname: String,
  Lname:String,
  Gender: String,
  username: String,
  email: String,
  password: String,
  role: String,
  ContactNo: String,
  DOB: String,
  token:String,
  savedParams: Array
});

const campusSchema = new mongoose.Schema({
  campusname : String,
  buildings : Array,
  classes : Array,
  student_details : Array,
  faculty_details : Array,
  staff_details : Array
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
    ID: req.body.ID,
    Fname: req.body.Fname,
    Lname: req.body.Lname,
    Gender: req.body.Gender,
    ContactNo: req.body.ContactNo,
    DOB: req.body.DOB,
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
//12th API
app.get("/campus/masterdata/campusbuildings", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    Campus.findOne({campusname:req.session.campusname},function(err,foundCampus){
      if(!err && foundCampus){
        let arr_Build = []
        for(let i = 0;i<foundCampus.buildings.length;i++){
          arr_Build.push({"Id":foundCampus.buildings[i].BuildingId,
          "BuildingName":foundCampus.buildings[i].BuildingName,
          "BuildingType":foundCampus.buildings[i].BuildingType,
          "NoOfFloors":foundCampus.buildings[i].NoOfFloors,
          "NumberOfWorkers":foundCampus.buildings[i].NumberOfWorkers,
          "Status":"Enabled Or Disabled"}
          );
        }
        res.send({"message":arr_Build});
      }else{
        res.send({"message":"campus not found."});
      }
    });
  }
});
//13th API
app.get("/campus/masterdata/campusbuildings/viewdata", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    Campus.findOne({campusname:req.session.campusname},function(err,foundCampus){
      if(!err && foundCampus){
        for(let i=0;i<foundCampus.buildings.length;i++){
          if(foundCampus.buildings[i].BuildingId === req.body.BuildingId){
            res.send(foundCampus.buildings[i])
            break;
          }
        }
      }else{
        res.send({"message":"Campus not found"});
      }
    });
  }
});
//14th API dummy
app.post("/campus/masterdata/campusbuildings/upload", bodyParser.json() ,function(req,res){
  if(!req.session.sessionId){
    res.send("login first");
  }else{
    //code to store the input
    res.send({'message':'uploaded successfully'});
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
//17th API
app.get("/campus/masterdata/classschedule", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    Campus.findOne({campusname:req.session.campusname},function(err,foundCampus){
      if(!err && foundCampus){
        let arr_class = []
        for(let i = 0;i<foundCampus.classes.length;i++){
          arr_class.push({"CourseID":foundCampus.classes[i].CourseID,
          "BuildingName":foundCampus.classes[i].BuildingName,
          "RoomID":foundCampus.classes[i].RoomID,
          "Strength":foundCampus.classes[i].Strength,
          "Departments":foundCampus.classes[i].Departments,
          "Status":"Enabled Or Disabled"}
          );
        }
        res.send({"message":arr_class});
      }else{
        res.send({"message":"campus not found."});
      }
    });
  }
});
//18th API 
app.get("/campus/masterdata/classschedule/viewdetails", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    Campus.findOne({campusname:req.session.campusname},function(err,foundCampus){
      if(!err && foundCampus){
        for(let i=0;i<foundCampus.classes.length;i++){
          if(foundCampus.classes[i].CourseID === req.body.CourseID){
            res.send(foundCampus.classes[i])
            break;
          }
        }
      }else{
        res.send({"message":"Campus not found"});
      }
    });
  }
});
//19th API
app.delete('/campus/masterdata/classschedule/deleteclass',function(req,res){
  if(!req.session.sessionId){
    console.log("login first");
  }else{
    Campus.findOne({campusname:req.session.campusname},function(err,foundCampus){
      if(!err && foundCampus){
        for(let i=0;i<foundCampus.classes.length;i++){
          if(foundCampus.classes[i].CourseID === req.body.CourseID){
            foundCampus.classes.splice(i,1);
            break;
          }
        }
        foundCampus.save(error => {if(error){console.log(error);}});
        res.send({"message":"Class deleted successfully"});
      }else{
        res.send({"message":"Campus not found"});
      }
    });
  }
});
//20th API
app.post("/campus/masterdata/classschedule/addclass", bodyParser.json() ,function(req,res){
  if(!req.session.sessionId){
    res.send("login first");
  }else{
    Campus.findOne({campusname:req.session.campusname},function(err,foundCampus){
      if(err){
        res.send(err);
      }else{
        if(foundCampus){
          if(foundCampus.classes.length === 10){
            res.send({"message":"limit reached"});
          }else{
            foundCampus.classes.push(req.body);
            foundCampus.save();
            res.send({"message":"Saved Successfully"});
          }
        }
      }
    });
  }
});
//21st API
app.get("/campus/masterdata/classschedule/addclass/getbuildingname", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    Campus.findOne({campusname:req.session.campusname},function(err,foundCampus){
      if(!err && foundCampus){
        let arr = []
        for(let i = 0;i<foundCampus.classes.length;i++){
          arr.push({"BuildingName":foundCampus.classes[i].BuildingName});
        }
        res.send({"message":arr});
      }else{
        res.send({"message":"campus not found."});
      }
    });
  }
});
//22nd API
app.get("/campus/masterdata/classschedule/addclass/getroomid", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    Campus.findOne({campusname:req.session.campusname},function(err,foundCampus){
      if(!err && foundCampus){
        let arr = []
        for(let i = 0;i<foundCampus.classes.length;i++){
          arr.push({"RoomID":foundCampus.classes[i].RoomID});
        }
        res.send({"message":arr});
      }else{
        res.send({"message":"campus not found."});
      }
    });
  }
});
//23rd API
app.get("/campus/masterdata/classschedule/addclass/getStudentStrength", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    Campus.findOne({campusname:req.session.campusname},function(err,foundCampus){
      if(!err && foundCampus){
        let arr = []
        for(let i = 0;i<foundCampus.classes.length;i++){
          arr.push({"StudentStrength":foundCampus.classes[i].StudentStrength});
        }
        res.send({"message":arr});
      }else{
        res.send({"message":"campus not found."});
      }
    });
  }
});
//24th API
app.get("/campus/masterdata/classschedule/addclass/getCourseInstructor", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    Campus.findOne({campusname:req.session.campusname},function(err,foundCampus){
      if(!err && foundCampus){
        let arr = []
        for(let i = 0;i<foundCampus.classes.length;i++){
          arr.push({"CourseInstructor":foundCampus.classes[i].CourseInstructor});
        }
        res.send({"message":arr});
      }else{
        res.send({"message":"campus not found."});
      }
    });
  }
});
//25th API dummy
app.post("/campus/masterdata/classSchedule/addclass/addStudentComposition", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    res.send({"message":"Saved successfully"});
  }
});
//26th API dummy
app.patch("/campus/masterdata/classSchedule/addclass/editStudentComposition", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    res.send({"message":"Updated"});
  }
});
//27th API dummy
app.delete('/campus/masterdata/classSchedule/addclass/deleteStudentComposition',function(req,res){
  if(!req.session.sessionId){
    console.log("login first");
  }else{
    // code to delete
    res.send({'message':'Deleted Successfully'})
  }
});
//28th API 
app.get("/campus/masterdata/users", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    User.find({}, function (err, docs) {
      if (err){
          console.log(err);
      }
      else{
        let arr = []
        for(let i = 0;i<docs.length;i++){
          arr.push({"ID":docs[i].ID,
          "username":docs[i].username,
          "role":docs[i].role,
          "email":docs[i].email,
          "ContactNo":docs[i].ContactNo,
          "Status":"Enabled Or Disabled"
          });
        }
        res.send({"message":arr});
      }
    });
  }
});
//29th API
app.get("/campus/masterdata/users/viewdetails", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    User.find({}, function (err, docs) {
      if (err){
          console.log(err);
      }
      else{
        let arr = []
        for(let i = 0;i<docs.length;i++){
          if(docs[i].ID === req.body.ID){
            res.send({"ID":docs[i].ID,
            "Fname":docs[i].Fname,
            "Lname":docs[i].Lname,
            "username":docs[i].username,
            "role":docs[i].role,
            "email":docs[i].email,
            "ContactNo":docs[i].ContactNo,
            "DOB":docs[i].DOB
            })
            break;
          }
        }
      }
    });
  }
});
//30th API
app.post("/campus/masterdata/users/adduser", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    user = new User({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
      ID: req.body.ID,
      Fname: req.body.Fname,
      Lname: req.body.Lname,
      Gender: req.body.Gender,
      ContactNo: req.body.ContactNo,
      DOB: req.body.DOB,
      token: uid(16),
      savedParams: [],
    });
    user.save();
    res.send({"Message":"Saved"});
  }
});
//31st API dummy
app.post("/campus/masterdata/surveyuploader", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    res.send({"Message":"Uploaded"});
  }
});
//32nd API dummy
app.delete('/campus/masterdata/surveyuploader/delete',function(req,res){
  if(!req.session.sessionId){
    console.log("login first");
  }else{
    // code to delete
    res.send({'message':'Deleted Successfully'})
  }
});
//33rd API dummy
app.patch("/campus/masterdata/surveyuploader/update", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    res.send({"message":"Updated"});
  }
});
//34th API dummy
app.get("/campus/masterdata/surveyuploader/download", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    res.send({"File":"Excelfile"});
  }
});
//35th API dummy
app.post("/campus/masterdata/campusmapuploader/add", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    res.send({"Message":"Saved"});
  }
});
//36th API dummy
app.patch("/campus/masterdata/campusmapuploader/update", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    res.send({"message":"Updated"});
  }
});
//37th API dummy
app.post("/campus/masterdata/studentdatauploader/add", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    res.send({"Message":"Added"});
  }
});
//38th API dummy
app.delete('/campus/masterdata/studentdatauploader/delete',function(req,res){
  if(!req.session.sessionId){
    console.log("login first");
  }else{
    // code to delete
    res.send({'message':'Deleted Successfully'})
  }
});
//39th API dummy
app.patch("/campus/masterdata/studentdatauploader/update", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    res.send({"message":"Updated"});
  }
});
//40th API
app.get("/campus/masterdata/batchwisestudentdetails", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    Campus.findOne({campusname:req.session.campusname},function(err,foundCampus){
      if(!err && foundCampus){
        let arr_class = []
        for(let i = 0;i<foundCampus.student_details.length;i++){
          arr_class.push({"BatchID":foundCampus.student_details[i].BatchID,
          "BatchCode":foundCampus.student_details[i].BatchCode,
          "Departments":foundCampus.student_details[i].Departments,
          "ProgramCode":foundCampus.student_details[i].ProgramCode,
          "YearOfStudy":foundCampus.student_details[i].YearOfStudy,
          "Strength":foundCampus.student_details[i].Strength,
          "Status":"Enabled Or Disabled"}
          );
        }
        res.send({"message":arr_class});
      }else{
        res.send({"message":"campus not found."});
      }
    });
  }
});
//41st API
app.post("/campus/masterdata/batchwisestudentdetails/add", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    Campus.findOne({campusname:req.session.campusname},function(err,foundCampus){
      if(err){
        res.send(err);
      }else{
        if(foundCampus){
          if(foundCampus.student_details.length === 10){
            res.send({"message":"limit reached"});
          }else{
            foundCampus.student_details.push(req.body);
            foundCampus.save();
            res.send({"Message":"Added"});
          }
        }
      }
    });
  }
});
//42nd API
app.delete('/campus/masterdata/batchwisestudentdetails/delete',function(req,res){
  if(!req.session.sessionId){
    console.log("login first");
  }else{
    Campus.findOne({campusname:req.session.campusname},function(err,foundCampus){
      if(!err && foundCampus){
        for(let i=0;i<foundCampus.student_details.length;i++){
          if(foundCampus.student_details[i].BatchID === req.body.BatchID){
            foundCampus.student_details.splice(i,1);
            break;
          }
        }
        foundCampus.save(error => {if(error){console.log(error);}});
        res.send({"message":"Deleted Successfully"});
      }else{
        res.send({"message":"Campus not found"});
      }
    });
  }
});
//43rd API 
app.get("/campus/masterdata/facultydetails", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    Campus.findOne({campusname:req.session.campusname},function(err,foundCampus){
      if(!err && foundCampus){
        let arr_class = []
        for(let i = 0;i<foundCampus.faculty_details.length;i++){
          arr_class.push({"ID":foundCampus.faculty_details[i].ID,
          "Courses":foundCampus.faculty_details[i].Courses,
          "Departments":foundCampus.faculty_details[i].Departments,
          "ResidenceBuildingName":foundCampus.faculty_details[i].ResidenceBuildingName,
          "AdultFamilyMembers":foundCampus.faculty_details[i].AdultFamilyMembers,
          "NoofChildren":foundCampus.faculty_details[i].NoofChildren,
          "Status":"Enabled Or Disabled"}
          );
        }
        res.send({"message":arr_class});
      }else{
        res.send({"message":"campus not found."});
      }
    });
  }
});
//44th API
app.post("/campus/masterdata/facultydetails/add", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    Campus.findOne({campusname:req.session.campusname},function(err,foundCampus){
      if(err){
        res.send(err);
      }else{
        if(foundCampus){
          if(foundCampus.faculty_details.length === 10){
            res.send({"message":"limit reached"});
          }else{
            foundCampus.faculty_details.push(req.body);
            foundCampus.save();
            res.send({"Message":"Added"});
          }
        }
      }
    });
  }
});
//45th API
app.get("/campus/masterdata/facultydetails/add/residencebuildname", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    Campus.findOne({campusname:req.session.campusname},function(err,foundCampus){
      if(!err && foundCampus){
        let arr_class = []
        for(let i = 0;i<foundCampus.faculty_details.length;i++){
          arr_class.push(foundCampus.faculty_details[i].ResidenceBuildingName);
        }
        res.send({"ResidenceBuildingName":arr_class});
      }else{
        res.send({"message":"campus not found."});
      }
    });
  }
});
//46th API
app.delete('/campus/masterdata/facultydetails/delete',function(req,res){
  if(!req.session.sessionId){
    console.log("login first");
  }else{
    Campus.findOne({campusname:req.session.campusname},function(err,foundCampus){
      if(!err && foundCampus){
        for(let i=0;i<foundCampus.faculty_details.length;i++){
          if(foundCampus.faculty_details[i].ID === req.body.ID){
            foundCampus.faculty_details.splice(i,1);
            break;
          }
        }
        foundCampus.save(error => {if(error){console.log(error);}});
        res.send({"message":"Deleted Successfully"});
      }else{
        res.send({"message":"Campus not found"});
      }
    });
  }
});
//47th API
app.get("/campus/masterdata/staffdetails", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    Campus.findOne({campusname:req.session.campusname},function(err,foundCampus){
      if(!err && foundCampus){
        let arr_class = []
        for(let i = 0;i<foundCampus.staff_details.length;i++){
          arr_class.push({"ID":foundCampus.staff_details[i].ID,
          "StaffCategory":foundCampus.staff_details[i].StaffCategory,
          "WorkplaceBuildingName":foundCampus.staff_details[i].WorkplaceBuildingName,
          "ResidenceBuildingName":foundCampus.staff_details[i].ResidenceBuildingName,
          "AdultFamilyMembers":foundCampus.staff_details[i].AdultFamilyMembers,
          "NoofChildren":foundCampus.staff_details[i].NoofChildren,
          "Status":"Enabled Or Disabled"}
          );
        }
        res.send({"message":arr_class});
      }else{
        res.send({"message":"campus not found."});
      }
    });
  }
});
//48th API
app.post("/campus/masterdata/staffdetails/add", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    Campus.findOne({campusname:req.session.campusname},function(err,foundCampus){
      if(err){
        res.send(err);
      }else{
        if(foundCampus){
          if(foundCampus.staff_details.length === 10){
            res.send({"message":"limit reached"});
          }else{
            foundCampus.staff_details.push(req.body);
            foundCampus.save();
            res.send({"Message":"Added"});
          }
        }
      }
    });
  }
});
//49th API
app.delete('/campus/masterdata/staffdetails/delete',function(req,res){
  if(!req.session.sessionId){
    console.log("login first");
  }else{
    Campus.findOne({campusname:req.session.campusname},function(err,foundCampus){
      if(!err && foundCampus){
        for(let i=0;i<foundCampus.staff_details.length;i++){
          if(foundCampus.staff_details[i].ID === req.body.ID){
            foundCampus.staff_details.splice(i,1);
            break;
          }
        }
        foundCampus.save(error => {if(error){console.log(error);}});
        res.send({"message":"Deleted Successfully"});
      }else{
        res.send({"message":"Campus not found"});
      }
    });
  }
});
//50th API dummy
app.get("/campus/campussimulator/visualpanel/buildingoccupancy", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    res.send({
      "HostelB1":Math.floor(Math.random() * 60) + 40,
      "HostelG1":Math.floor(Math.random() * 40) + 30,
      "Academic East": Math.floor(Math.random() * 5) + 15,
      "Kendriya Bhandar": Math.floor(Math.random() * 15) + 20
     });
  }
});
//51st API dummy
app.get("/campus/campussimulator/visualpanel/casestatisics", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    res.send({
      "Cumulative_infections":Math.floor(Math.random() * 20) + 40,
      "Active_infections":Math.floor(Math.random() * 10) + 25,
      "Daily_infections": Math.floor(Math.random() * 10) ,
      "Cumulative_positive_cases": Math.floor(Math.random() * 10) + 30,
      "Active_cases":Math.floor(Math.random() * 5) + 15,
      "Daily_positive_cases": Math.floor(Math.random() * 7),
      "Cumulative_symptomatic":Math.floor(Math.random() * 15) + 30,
      "Recovered":Math.floor(Math.random() * 10) + 5,
      "Died":Math.floor(Math.random() * 5)
     });
  }
});
//52nd API dummy
app.get("/campus/campussimulator/visualpanel/peoplelocations", function (req, res) {
	if (!req.session.sessionId) {
		res.send("login first");
	} else {
    res.send(
      {
        "day" : 1,
        "time":"00:00",
        "locations":
        [
          {
            "ID":15,
            "X-coordinate":10.32,
            "Y-coordinate":5.67,
            "state": "Healthy",
            "role":"student"
          },
          {
            "ID":16,
            "X-coordinate":8.23,
            "Y-coordinate":9.10,
            "state": "Asymptomatic",
            "role":"faculty"
          },
        ]  
      } 
    );
  }
});
app.listen(3000, function() {
  console.log("Server started on port 3000");
});
