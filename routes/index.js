var express    = require("express");
var router     = express.Router();
var passport   = require("passport");

// Root Route
router.get("/", function(req, res){
    res.render("landing");    
});

// Signup Form
router.get("/signup", function(req, res) {
    res.render("signup");
});

// Login Form
router.get("/login", function(req, res) {
    res.render("login");    
});

// Logout Route
router.get("/logout", function(req, res) {
   req.logout();
   res.redirect("/places");
});

module.exports = router;
