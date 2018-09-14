var express     = require("express");
var router      = express.Router();
var Place       = require("../models/place");
var middleware  = require("../middleware");

//INDEX - show all places
router.get("/places", function(req, res){
    // Get all places from DB
    Place.find({}, function(err, allPlaces){
        if(err){
            req.flash("error", "Failed to retrieve places.");
            res.redirect("/");
        } else {
           res.render("places/index", {places: allPlaces}); 
        }
    });
});

//NEW - show form to create new place
router.get("/places/new", middleware.isLoggedIn, function(req, res){
    res.render("places/new");
});

//CREATE - add new place to DB
router.post("/places", middleware.isLoggedIn, function(req, res){
    // get data from form and add to places array
    var name = req.body.name;
    var address = req.body.address;
    var image = req.body.image;
    var desc = req.body.description;
    var recoms = 0;
    var author = {
        id: req.user._id,
        username: req.user.firstName + " " + req.user.lastName
    };
    var newPlace = {name: name, address: address, image: image, description: desc, author: author, recoms: recoms};
    // Create a new place and save to DB
    Place.create(newPlace, function(err, newlyCreated){
        if(err) {
            req.flash("error", "Failed to create new place.");
            res.redirect("/places");
        } else {
            res.redirect("/places");    
        }
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
           res.render("places/show", {place: foundPlace});
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


module.exports = router;