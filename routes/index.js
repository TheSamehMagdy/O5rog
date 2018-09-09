var express    = require("express");
var router     = express.Router();
var passport   = require("passport");
var User       = require("../models/user");

// Root Route
router.get("/", function(req, res){
    res.render("places/index");    
});

// Signup Form
router.get("/signup", function(req, res) {
    res.render("signup");
});

// Signup Logic
router.post("/signup", function(req, res) {
    var newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        avatar: req.body.avatar
    });
    
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("signup", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to Egyplaces, " + user.username + "!");
            res.redirect("/");
        });
    });
});

// Login Form
router.get("/login", function(req, res) {
    res.render("login");    
});

// Login Logic
router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/",
        failureRedirect: "/login"
    }), function(req, res) {
});

// Logout Route
router.get("/logout", function(req, res) {
   req.logout();
   res.redirect("/");
});

module.exports = router;
