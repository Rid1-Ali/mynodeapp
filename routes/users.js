const express = require('express')
const router = express.Router();
const bcrypt = require("bcryptjs")
const passport = require('passport');
const path = require('path');

var multer = require("multer");
var destination = path.join(__dirname ,'../audios/');

var uploading = multer({

  dest: destination

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
      errors: errors
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

//Ajax uploading
router.post('/upload', uploading.single('audio'), function (req, res) {

  console.log('Node Ajax is called');
 // console.log(typeof (req.formdata));



  console.log(req.file);
  res.send(req.file);


  //console.log(app.body)






  // if (Object.keys(alink).length == 0) {
  //     return res.status(400).send('Audio is not submitted');
  //   }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  //let sampleFile = alink;

  // Use the mv() method to place the file somewhere on your server
  // sampleFile.mv(path.join(__dirname ,'audios/adis123.wav'), function(err) {
  //   if (err)
  //     return res.status(500).send(err);

  //   res.send('File uploaded!');
  // });

})


module.exports = router;