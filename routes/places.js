var express    = require("express");
var router     = express.Router();
var Place      = require("../models/place");
var middleware = require("../middleware");

//INDEX - show all places
router.get("/", function(req, res){
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
router.get("/newplace", middleware.isLoggedIn, function(req, res){
    res.render("places/newplace");
});

//CREATE - add new place to DB
router.post("/", middleware.isLoggedIn, function(req, res){
    // get data from form and add to places array
    var name = req.body.name;
    var address = req.body.address;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    var newPlace = {name: name, address: address, image: image, description: desc, author: author};
    // Create a new place and save to DB
    Place.create(newPlace, function(err, newlyCreated){
        if(err) {
            req.flash("error", "Failed to create new place.");
            res.redirect("/");
        } else {
            res.redirect("/");    
        }
    });
});

//SHOW - show more info about one place
router.get("/:id", function(req, res){
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
// router.get("/:id/edit", middleware.checkPlaceOwnership, function(req, res) {
//         Place.findById(req.params.id, function(err, foundPlace){
//             if(err){
//                 req.flash("error", "Place not found.");
//                 res.redirect("/");
//             }
//             res.render("editplace", {place: foundPlace});    
//         });
// });

//UPDATE - update place
// router.put("/:id", middleware.checkPlaceOwnership, function(req, res) {
//     Place.findByIdAndUpdate(req.params.id, req.body.place, function(err, updatedPlace){
//         if(err) {
//             req.flash("error", "Place not found.");
//             res.redirect("/");
//         } else {
//             res.redirect("/" + req.params.id);
//         }
//     });  
// });

// DESTROY - delete place
router.delete("/:id", middleware.checkPlaceOwnership, function(req, res){
  Place.findByIdAndRemove(req.params.id, function(err){
      if(err) {
          req.flash("error", "Place not found.");
          res.redirect("/");
      } else {
          res.redirect("/");
      }
  });
});

module.exports = router;