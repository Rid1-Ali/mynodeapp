const express = require('express')
const router = express.Router();
const bcrypt = require("bcryptjs")
const passport = require('passport');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
var multer = require("multer");
//var no = 'test';
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
  try {
    res.send(req.user._id);
  } catch (error) {

  }

});

//Ajax uploading
router.post('/upload', uploading.single('audio'), function (req, res) {

  //console.log('Node Ajax is called');
  //console.log(typeof (req.formdata));
  //console.log('noOfTimes from serverside is ' + req.body.noOfTimes)
  //console.log('Metin number is '+no);

  no2 = parseInt(req.body.no, 10);
  userId = req.user._id;
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("nodekb");

    var myquery = { no: no2 };
    var newvalues = { $push: { readBy: req.user._id.toString() } };

    var myquery2 = { uid: userId.toString(), textNo: no2 }
    var newvalues2 = { $set: { timesRead: parseInt(req.body.noOfTimes, 10) } }


    //dbo.collection("repeat").update(myquery2, newvalues2, { upsert: false });
    dbo.collection("repeat").update(myquery2, newvalues2, { upsert: false, multi: true });
    //var myquery = { address: "Valley 345" };
    //var newvalues = { $set: { name: "Mickey", address: "Canyon 123" } };
    //dbo.collection("repeat").update({ name: "ridwan" }, { $set: { address: "Canyon 123" } }, { upsert: false });
    //console.log("True or False: " + (parseInt(req.body.noOfTimes, 10) > 3));

    if (parseInt(req.body.noOfTimes, 10) > 3) {
      dbo.collection("texts").update(myquery, newvalues, { upsert: false, multi: true });

    }
    db.close();
  });





  res.send(req.file);


  //console.log(app.body)
})


// Login Process
router.get('/gettext', async function (req, res) {


  let metinNumber;
  let times;
  var current = { text: "You Finised All" };


  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("nodekb");


    dbo.collection("texts").find().toArray(function (err, result) {
      if (err) throw err;
      for (let value of result) {
        if (!(value.readBy.includes(req.user._id.toString()))) {
          metinNumber = value.no;
          //("userId is: " + req.user._id.toString() + " did not read metin number " + value.no);


          //console.log("Metin number is " + metinNumber);
          current = value
          //current.timesRead = 5
          //console.log("current is " + JSON.stringify(current) );
          break;
        }
      }
      dbo.collection("repeat").find({ uid: req.user._id.toString(), textNo: parseInt(metinNumber, 10) }).toArray(function (err, doc) //find if a value exists
      {
        var times = 0;
        //console.log("Doc is:");
        //console.log(doc);

        if (doc.length > 0) //if it does
        {
          //console.log("This User exists in this metin. UserId: " + req.user._id.toString() + " and from database: " + doc[0].uid + " With timesRead " + doc[0].timesRead);
          //console.log("No of times inside is " + noOfTimes);
          times = doc[0].timesRead;


        } else {
          var toBeSent = {
            uid: req.user._id.toString(),
            textNo: metinNumber,
            timesRead: 0
          }
          MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            // insert document to 'repeat' collection using insertOne
            db.collection("repeat").insertOne(toBeSent, function (err, res) {
              if (err) throw err;
              //console.log("Document inserted");
              // close the connection to db when you are done with it
              db.close();
            });
          });


        }
        //console.log("Times read is " + times);
        current.timesRead = times
        //console.log("Current is above of last \n " + JSON.stringify(current));
        res.send(current)
      })

      //("Current is lasr \n" + JSON.stringify(current));

    })







    //res.send(current)
  })


  //metinNumber =  getUnreadMetin(req.user._id.toString());


})

function getUnreadMetin(uid) {

  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("nodekb");


    dbo.collection("texts").find().toArray(function (err, result) {
      if (err) throw err;
      for (let value of result) {
        if (!(value.readBy.includes(uid.toString()))) {
          //console.log("userId is: " + uid + " did not read metin number " + value.no);

          db.close();

          return value.no;


        }
      }
    })
  })

}


module.exports = router;


