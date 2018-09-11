var Place = require("../models/place");

var middlewareObj = {};

middlewareObj.checkplaceOwnership = function(req, res, next) {
 if(req.isAuthenticated()){
        Place.findById(req.params.id, function(err, foundPlace){
           if(err || !foundPlace){
               req.flash("error", "Place not found.");
               res.redirect("back");
           }  else {
               // does user own the place?
            if(foundPlace.author.id.equals(req.user._id)) {
                next();
            } else {
                req.flash("error", "You don't have permission to do that.");
                res.redirect("back");
            }
           }
        });
    } else {
        req.flash("error", "You need to be logged in to do that.");
        res.redirect("back");
    }
};


middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to do that.");
    res.redirect("/login");
};

module.exports = middlewareObj;