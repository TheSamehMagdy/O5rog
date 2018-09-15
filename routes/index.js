var express    = require("express");
var router     = express.Router();
var passport   = require("passport");
var User       = require("../models/user");
var Place      = require("../models/place");

// Root Route
router.get("/", function(req, res){
    res.redirect("/places");    
});

// Signup Form
router.get("/signup", function(req, res) {
    res.render("signup");
});

// Signup Logic
router.post("/signup", function(req, res) {
    var newUser = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        username: req.body.firstName + " " + req.body.lastName,
        email: req.body.email,
        avatar: req.body.avatar
    });
    
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("signup", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to Egyplaces, " + user.firstName + "!");
            res.redirect("/places");
        });
    });
});

// Login Form
router.get("/login", function(req, res) {
    res.render("login", {referer: req.headers.referer});    
});

// Login Logic
router.post("/login", passport.authenticate("local", {failureRedirect: "/login"}), (req, res) => {
    if (req.body.referer && (req.body.referer !== undefined && req.body.referer.slice(-6) !== "/login")) {
        // redirect to the page user was on before clicking "login"
        res.redirect(req.body.referer);
    } else {
        res.redirect("/places");
    }
});

// Logout Route
router.get("/logout", function(req, res) {
   req.logout();
   res.redirect("/places");
});

// User profile
router.get("/users/:id", function(req, res) {
   User.findById(req.params.id, function(err, foundUser){
       if(err) {
           req.flash("error", "User not found.");
           res.redirect("back");
       }
       Place.find().where("author.id").equals(foundUser._id).exec(function(err, places){
       if(err) {
           req.flash("error", "User not found.");
           res.redirect("back");
       }
        Place.find().where("recomUsers").in(foundUser._id).exec(function(err, recomPlaces){
            if(err) {
                req.flash("error", "Something went wrong.");
                res.redirect("back");    
            }
        res.render("users/show", {user: foundUser, places: places, recomPlaces: recomPlaces});
       });
   });
});
});

module.exports = router;
