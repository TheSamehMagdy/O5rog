var express    = require("express");
var router     = express.Router();
var passport   = require("passport");
var User       = require("../models/user");
var Place      = require("../models/place");
var middleware  = require("../middleware");
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed.'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'o5rog', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Root Route
router.get("/", function(req, res){
    res.redirect("/places");    
});

// Signup Form
router.get("/signup", function(req, res) {
    res.render("signup");
});

// Signup Logic
router.post("/signup", upload.single("avatar"), function(req, res) {
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
        if(err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        var firstName = req.body.firstName;
        var lastName = req.body.lastName;
        var username = firstName + " " + lastName;
        var email = req.body.email;
        var newUser = {avatar: result.secure_url, avatarId: result.public_id, firstName: firstName, lastName: lastName, username: username, email: email};
        User.register(newUser, req.body.password, function(err, user){
        if(err){
            return res.render("signup", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to O5rog, " + user.firstName + "!");
            res.redirect("/places");
        });
    });
    });
});

// Login Form
router.get("/login", function(req, res) {
    res.render("login", {referer: req.headers.referer});    
});

// Login Logic
router.post("/login", passport.authenticate("local", {failureRedirect: "/login", failureFlash: true}), function(req, res) {
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

// User profile - SHOW
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

// User profile - EDIT
router.get("/users/:id/edit", middleware.checkUser, function(req, res) {
   User.findById(req.params.id, function(err, foundUser){
       if(err) {
           req.flash("error", err.message);
           res.redirect("back");
       }
        res.render("users/edit", {user: foundUser});
       });
});

// User profile - UPDATE
router.put("/users/:id", middleware.checkUser, upload.single("avatar"), function(req, res) {
    User.findById(req.params.id, async function(err, user){
        if(err) {
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if(req.file) {
                try {
                    if(user.avatarId) {
                        await cloudinary.v2.uploader.destroy(user.avatarId);
                    }
                    var result = await cloudinary.v2.uploader.upload(req.file.path);
                    user.avatarId = result.public_id;
                    user.avatar = result.secure_url;
                } catch(err) {
                    req.flash("error", err.message);
                    return res.redirect("back");    
                }
            }
            user.firstName = req.body.firstName;
            user.lastName = req.body.lastName;
            user.save();
            req.flash("success", "Changes Saved!");
            res.redirect("/users/" + req.params.id);
        }
    });  
});

// User profile - DELETE
router.delete("/users/:id/delete", middleware.checkUser, function(req, res) {
    User.findById(req.params.id, function(err, foundUser){
        if(err) {
            req.flash("error", err.message);
            res.redirect("back");
        }
            foundUser.remove();
            req.flash('success', 'User deleted successfully.');
            res.redirect('/') ;
        });
 });

// Facebook authorization
router.get('/auth/facebook', passport.authenticate('facebook', {scope:"email"}));
router.get('/auth/facebook/callback', passport.authenticate('facebook', 
{ successRedirect: '/places', failureRedirect: '/login' }));


module.exports = router;
