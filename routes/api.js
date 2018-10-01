var express       = require("express");
var app           = express();
var router        = express.Router();
var LocalStrategy = require("passport-local");
var passport      = require("passport");
var User          = require("../models/user");
var Place         = require("../models/place");
var middleware    = require("../middleware");
var multer        = require('multer');
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

//=================//
// PLACES ROUTES   //
//=================//

// PLACES INDEX 
router.get("/api/places", function (req, res, next) {
    Place.find({}, function(err, allPlaces){
        if(err){
            return next(err);
        } else {
            res.json(allPlaces);
        }
    });
});

// PLACES CREATE
router.post("/api/places", middleware.isLoggedIn, upload.single("image"), function(req, res, next){
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
        if (err){
            return next(err);   
        }
        req.body.place.image = result.secure_url;
        req.body.place.imageId = result.public_id;
        var name = req.body.place.name;
        var address = req.body.place.address;
        var desc = req.body.place.description;
        var recoms = 0;
        var author = {
            id: req.user._id,
            username: req.user.firstName + " " + req.user.lastName
        };
        var newPlace = {name: name, address: address, image: req.body.place.image, imageId: req.body.place.imageId, description: desc, recoms: recoms, author: author};
        Place.create(newPlace, function(err, newlyCreated){
            if(err) {
                req.flash("error", "Failed to create new place.");
                res.redirect("/places");
            } else {
                res.redirect("/places");    
            }
        }, res.json(newPlace));
    });
});

// PLACES SHOW
router.get("/api/places/:id", function(req, res){
    Place.findById(req.params.id).populate("comments").exec(function(err, foundPlace){
        if (err){
            res.send(err);
        }
        var recomUsersStr = foundPlace.recomUsers.toString();
        res.json({foundPlace, recomUsersStr});
    });
});

// PLACES UPDATE
router.put("/api/places/:id", middleware.checkPlaceOwnership, upload.single("image"), function(req, res) {
    Place.findById(req.params.id, async function(err, place){
        if(err) {
            res.send(err);
        } else {
            if(req.file) {
                try {
                    await cloudinary.v2.uploader.destroy(place.imageId);
                    var result = await cloudinary.v2.uploader.upload(req.file.path);
                    place.imageId = result.public_id;
                    place.image = result.secure_url;
                } catch(err) {
                    req.flash("error", err.message);
                    return res.redirect("back");    
                }
            }
            place.name = req.body.place.name;
            place.address = req.body.place.address;
            place.description = req.body.place.description;
            place.save();
        }
    res.json(place);
});
});

// PLACES DESTROY
router.delete("/api/places/:id", middleware.checkPlaceOwnership, function(req, res){
    Place.findByIdAndRemove(req.params.id, function(err, place){
        if(err) {
            res.send(err);
        } else {
    res.json(place);
}
});
});

// PLACES RECOMMEND
router.put("/api/places/:id/recom", middleware.isLoggedIn, function(req, res){
    Place.findById(req.params.id, function(err, place, recomUser){
        if(err){
            res.send(err);
        } else {
            // Check if user already recommended place
            var recomUsersStr = place.recomUsers.toString();
            if (recomUsersStr.includes(req.user.id)){
                // Don't incremenet recoms
                return req.send("You've already recomended this place.");
            } else {
            // Increment recoms and add user to recomUsers array of current place
            recomUser = req.user._id;
            place.recomUsers.push(recomUser);
            place.recoms++;
            place.save();
            }
        res.json(place);
        }
    });  
});

//PLACES UNRECOMMEND
router.put("/api/places/:id/unrecom", middleware.isLoggedIn, function(req, res){
    Place.findById(req.params.id, function(err, place, recomUser){
        if(err){
            res.send(err);
        } else {
            // Check if user already recommended place
            var recomUsersStr = place.recomUsers.toString();
            if (recomUsersStr.includes(req.user.id)){
                // decrement recoms and remove user from places recomUsers
                recomUser = req.user._id;
                var toRemove = place.recomUsers.indexOf(recomUser) - 1;
                place.recomUsers.splice(toRemove, 1);
                place.recoms--;
                place.save();
            }
        res.json(place);
        }
    });  
});


//=================//
// Auth ROUTES     //
//=================//

// SIGNUP
router.post("/api/signup", upload.single("avatar"), function(req, res, next) {
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
        if(err) {
            return next(err);
        }
        var firstName = req.body.firstName;
        var lastName = req.body.lastName;
        var username = firstName + " " + lastName;
        var email = req.body.email;
        var newUser = {avatar: result.secure_url, avatarId: result.public_id, firstName: firstName, lastName: lastName, username: username, email: email};
        User.register(newUser, req.body.password, function(err, user){
        if(err){
            return next(err);
        }
        passport.authenticate("local")(req, res, function(){
            res.json(user);
        });
    });
    });
});

// LOGIN
router.post("/api/login", passport.authenticate("local", {successRedirect: '/api/places', failureFlash: true}), function(req, res, next) {
        res.json(req.user);
});

// LOGOUT
router.get("/api/logout", function(req, res, next) {
   req.logout();
});

// Facebook authorization
router.get('/api/auth/facebook', passport.authenticate('facebook', {scope:"email"}));
router.get('/api/auth/facebook/callback', passport.authenticate('facebook', 
{ successRedirect: '/places', failureRedirect: '/login' }));

//=================//
// USER PROFILES   //
//=================//

// SHOW USER
router.get("/api/users/:id", function(req, res, next) {
   User.findById(req.params.id, function(err, foundUser){
       if(err) {
           return next(err);
       }
       Place.find().where("author.id").equals(foundUser._id).exec(function(err, places){
       if(err) {
           return next(err);
       }
        Place.find().where("recomUsers").in(foundUser._id).exec(function(err, recomPlaces){
            if(err) {
                return next(err);
            }
        res.json({foundUser, places, recomPlaces});
       });
   });
});
});

// UPDATE USER
router.put("/api/users/:id", middleware.checkUser, upload.single("avatar"), function(req, res, next) {
    User.findById(req.params.id, async function(err, user){
        if(err) {
            return next(err);
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
                    return next(err);
                }
            }
            user.firstName = req.body.firstName;
            user.lastName = req.body.lastName;
            user.save();
        }
        res.json(user);
    });  
});

//=================//
// ERROR HANDLING  //
//=================//
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message
    }
  });
});

module.exports = router;