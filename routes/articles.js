const express = require('express');
const router = express.Router();

//bring article mo
let Article = require('../models/article');
let User = require('../models/user');




//add route
router.get('/add', function (req, res) {
    res.render('add_article', {
        title: 'Add article'
    });
});
//Get single artice
router.get('/:id',ensureAuthenticated, function (req, res) {
    Article.findById(req.params.id, function (err, article) {
        res.render('article', {
            article: article
        });

    });
});

//Load Edit form
router.get('/edit/:id', function (req, res) {
    Article.findById(req.params.id, function (err, article) {

        res.render('edit_article', {
            //title : "Edit Article",
            article: article
        });
        console.log(article.author);
        return;

    });
});

//add submit POST route
router.post('/add', function (req, res) {
    req.checkBody('title', 'Title is requeired').notEmpty();
    //req.checkBody('author','author is requeired').notEmpty();
    req.checkBody('body', 'body is requeired').notEmpty();

    //get errors
    let errors = req.validationErrors();

    if (errors) {
        res.render('add_article', {
            title: 'Add Article',
            errors: errors
        });
    } else {
        let article = new Article();
        article.title = req.body.title;
        article.author = req.user._id;
        article.body = req.body.body;

        article.save(function (err) {
            if (err) {
                console.log(err);
                return;
            } else {
                req.flash('success', 'Article Added');
                res.redirect('/');
            }
        });
    }
});




//Edit a post
router.post('/edit/:id', function (req, res) {
    let article = {}
    article.title = req.body.title;
    article.author = req.body.author;
    article.body = req.body.body;

    let query = { _id: req.params.id }



    Article.update(query, article, function (err) {
        if (err) {
            console.log(err);
            return;
        } else {
            req.flash('danger', 'Article Added')
            res.redirect('/');
        }
    });


});


//Delete Article
router.delete('/:id', function (req, res) {
    let query = { _id: req.params.id }

    Article.remove(query, function (err) {
        if (err) {
            console.log(err);

        }
        res.send('Success');
    });
});
//Get single artice
// Get Single Article
router.get('/:id', function(req, res){
    Article.findById(req.params.id, function(err, article){
      User.findById(article.author, function(err, user){
        res.render('article', {
          article: article,
          author: user.name
        });
      });
    });
  });

//Access control
function ensureAuthenticated(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }else{
        req.flash('danger','Please login')
        res.redirect('/users/login')
    }

}

module.exports = router;