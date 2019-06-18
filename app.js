const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const config = require('./config/database')
const passport = require('passport');
var multer = require("multer");


mongoose.connect(config.database);
let db = mongoose.connection;

//check conn
db.once('open', function () {
    console.log("connected to DB!!!!!!");

})

//check for db errors
db.on('error', function () {
    console.log(err);

});



//int app
const app = express();

//bring models
let Article = require('./models/article');




//load view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

//set Public folder
app.use(express.static(path.join(__dirname,'public')));

//Express session Middleware
app.set('trust proxy', 1);
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
  }));



//Express Messages Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

//Express validator Middleware
app.use(expressValidator({
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.')
        , root    = namespace.shift()
        , formParam = root;
  
      while(namespace.length) {
        formParam += '[' + namespace.shift() + ']';
      }
      return {
        param : formParam,
        msg   : msg,
        value : value
      };
    }
  }));

 
//Passport middleware
app.use(passport.initialize())
app.use(passport.session())

//Passport config
require('./config/passport')(passport);

app.get("*",function(req,res,next){
  res.locals.user = req.user || null;
  next();
});


//home route
app.get("/", function (req, res) {
    Article.find({}, function (err, articles) {

        if (err) {
            console.log(err);

        } else  {

            res.render('index', {
                title: 'Articles',
                articles: articles
            });
        }
    })
})


// Route files
let articles = require('./routes/articles');
let users = require('./routes/users');
app.use('/articles', articles);
app.use('/users', users);

//RecordPost
//I get the file, put it on form data, left is to process the data
app.post('/upload',function(req,res){
  console.log('Node Ajax is called');
  
  //console.log(app.body)
  var alink = 'req.body.name';


  if (Object.keys(alink).length == 0) {
      return res.status(400).send('Audio is not submitted');
    }
  
    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = alink;
  
    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv(path.join(__dirname ,'audios/adis123.wav'), function(err) {
      if (err)
        return res.status(500).send(err);
  
      res.send('File uploaded!');
    });
  
})






//start server
app.listen(3000, function () {
    console.log('Server started on 3000');

})