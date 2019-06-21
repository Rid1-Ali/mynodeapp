const express = require('express')
const router = express.Router();
const bcrypt = require("bcryptjs")
const passport = require('passport');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
var multer = require("multer");
var no = 'test';
var userId = 'test2';
const config = require('../config/database');
var url = config.database;

var destination = path.join(__dirname, '../audios/');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, destination)
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

var uploading = multer({

  storage: storage

});


//Bring in User Model
let User = require('../models/user');

//Register Form
router.get('/register', function (req, res) {
  res.render('register');
})

//Register a user
router.post('/register', function (req, res) {
  const name = req.body.name;
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;
  const password2 = req.body.password2;

  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('username', 'Username is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

  let errors = req.validationErrors();

  if (errors) {
    res.render('register', {
      errors: errorss
    });
  } else {
    let newUser = new User({
      name: name,
      email: email,
      username: username,
      password: password
    });

    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(newUser.password, salt, function (err, hash) {
        if (err) {
          console.log(err);
        }
        newUser.password = hash;
        newUser.save(function (err) {
          if (err) {
            console.log(err);
            return;
          } else {
            req.flash('success', 'You are now registered and can log in');
            res.redirect('/users/login');
          }
        });
      });
    });
  }
});
//login form
router.get('/login', function (req, res) {
  res.render('login')
})


// Login Process
router.post('/login', function (req, res, next) {
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

// out Process
router.get('/logout', function (req, res) {
  req.logOut();
  req.flash('Success', "You are logged out")
  res.redirect('/users/login');
});

//get userId
router.get('/getUserId', function (req, res) {
  res.send(req.user._id);
});

//Ajax uploading
router.post('/upload', uploading.single('audio'), function (req, res) {

  console.log('Node Ajax is called');
  // console.log(typeof (req.formdata));

  no = parseInt(req.body.no, 10);
  userId = req.user._id;
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("nodekb");
    var myquery = { "no": no };
    var newvalues = { $push: { readBy: req.user._id.toString() } };
    dbo.collection("texts").updateOne(myquery, newvalues, function (err, res) {
      if (err) throw err;
      console.log("1 document updated");
      db.close();
    });
  });




  res.send(req.file);


  //console.log(app.body)
})









// Login Process
router.get('/gettext', function (req, res) {
  var stat = true;
  var current = "You Finised All";
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("nodekb");
    var query = { no: 1 };
    dbo.collection("texts").find().toArray(function (err, result) {
      if (err) throw err;
      //console.log("Result is \n" + result);
      for (let value of result) {
        if (!(value.readBy.includes(req.user._id.toString()))) {
          console.log("userId is: " + req.user._id);
          //Check if the user and text exist in Repeat collection
          dbo.collection("repeat").find({ uid: req.user._id.toString(), textNo: value.no }, { $exists: true }).toArray(function (err, doc) //find if a value exists
          {
            console.log("Doc is:");
            console.log(doc);
            if (doc.length > 0) //if it does
            {
              console.log("User exists in this metin. UserId: " + req.user._id.toString() + " and from database: " + doc[0].uid);
              value.noOfTimes = doc[0].timesRead;
              console.log('Value is : ');
              console.log(value);
            }
            else // if it does not 
            {
              var toBeSent = {
                uid: req.user._id.toString(),
                textNo: value.no,
                timesRead: 0
              }
              console.log(toBeSent);
              MongoClient.connect(url, function (err, db) {
                if (err) throw err;



                // insert document to 'users' collection using insertOne
                db.collection("repeat").insertOne(toBeSent, function (err, res) {
                  if (err) throw err;
                  console.log("Document inserted");
                  // close the connection to db when you are done with it
                  db.close();
                });
              });

            }
          });
          current = value;
          break;
        }


      };
      //console.log(current);

      console.log('current.noOfTimes: ' + current.noOfTimes);

      res.send(current);
      console.log(req.user._id);


      db.close();
    });
  });





})

module.exports = router;