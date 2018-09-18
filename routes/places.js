var express     = require("express");
var router      = express.Router();
var Place       = require("../models/place");
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


//INDEX - show all places
router.get("/places", function(req, res){
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Place.find({name: regex}, function(err, allPlaces){
            if(err){
                req.flash("error", "Failed to retrieve places.");
                res.redirect("/");
            } else {
                if(allPlaces.length < 1) {
                    req.flash("error", "No matching place found.");
                    return res.redirect("back");
                }
                res.render("places/index", {places: allPlaces}); 
            }
        });        
    } else {
        // Get all places from DB
        Place.find({}, function(err, allPlaces){
            if(err){
                req.flash("error", "Failed to retrieve places.");
                res.redirect("/");
            } else {
               res.render("places/index", {places: allPlaces}); 
            }
        });
    }
});

//NEW - show form to create new place
router.get("/places/new", middleware.isLoggedIn, function(req, res){
    res.render("places/new");
});

router.post("/places", middleware.isLoggedIn, upload.single("image"), function(req, res){
    // get data from form and add to places array
    cloudinary.uploader.upload(req.file.path, function(result) {
        req.body.place.image = result.secure_url;
        var name = req.body.place.name;
        var address = req.body.place.address;
        var desc = req.body.place.description;
        var recoms = 0;
        var author = {
            id: req.user._id,
            username: req.user.firstName + " " + req.user.lastName
        };
        var newPlace = {name: name, address: address, image: req.body.place.image, description: desc, author: author, recoms: recoms};
        // Create a new campground and save to DB
        Place.create(newPlace, function(err, newlyCreated){
            if(err) {
                req.flash("error", "Failed to create new place.");
                res.redirect("/places");
            } else {
                res.redirect("/places");    
            }
        });
    });
});
 



//SHOW - show more info about one place
router.get("/places/:id", function(req, res){
    // find place with provided ID
    Place.findById(req.params.id).populate("comments").exec(function(err, foundPlace){
       if(err || !foundPlace) {
           req.flash("error", "Place not found.");
           res.redirect("back");
       } else {
           // render show template with that place
           var recomUsersStr = foundPlace.recomUsers.toString();
           res.render("places/show", {place: foundPlace, recomUsersStr: recomUsersStr});
       }
    });
});

//EDIT - show edit form
router.get("/places/:id/edit", middleware.checkPlaceOwnership, function(req, res) {
        Place.findById(req.params.id, function(err, foundPlace){
            if(err){
                req.flash("error", "Place not found.");
                res.redirect("/places");
            }
            res.render("places/edit", {place: foundPlace});    
        });
});

//UPDATE - update place
router.put("/places/:id", middleware.checkPlaceOwnership, function(req, res) {
    Place.findByIdAndUpdate(req.params.id, req.body.place, function(err, updatedPlace){
        if(err) {
            req.flash("error", "Place not found.");
            res.redirect("/places");
        } else {
            res.redirect("/places/" + req.params.id);
        }
    });  
});

// DESTROY - delete place
router.delete("/places/:id", middleware.checkPlaceOwnership, function(req, res){
  Place.findByIdAndRemove(req.params.id, function(err){
      if(err) {
          req.flash("error", "Place not found.");
          res.redirect("/places");
      } else {
          res.redirect("/places");
      }
  });
});

// Recommend Place
router.put("/places/:id/recom", middleware.isLoggedIn, function(req, res){
    Place.findById(req.params.id, function(err, place, recomUser){
        if(err){
            req.flash("error", "Something went wrong.");
            res.redirect("back");
        } else {
            // Check if user already recommended place
            var recomUsersStr = place.recomUsers.toString();
            if (recomUsersStr.includes(req.user.id)){
                // Don't incremenet recoms
                req.flash("success", "You've already recomended this place.");
                return res.redirect("back");            
            } else {
            // Increment recoms and add user to recomUsers array of current place
            recomUser = req.user._id;
            place.recomUsers.push(recomUser);
            place.recoms++;
            place.save();
            res.redirect("/places/" + req.params.id);
            }
        }
    });  
});

// Unrecommend place
router.put("/places/:id/unrecom", middleware.isLoggedIn, function(req, res){
    Place.findById(req.params.id, function(err, place, recomUser){
        if(err){
            req.flash("error", "Something went wrong.");
            res.redirect("back");
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
                res.redirect("/places/" + req.params.id);
            }
        }
    });  
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}


module.exports = router;