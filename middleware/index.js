var Place   = require("../models/place");
var Comment = require("../models/comment");
var User    = require("../models/user")

var middlewareObj = {};

middlewareObj.checkPlaceOwnership = function(req, res, next) {
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

middlewareObj.checkCommentOwnership = function(req, res, next) {
 if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
           if(err || !foundComment){
               req.flash("error", "Comment not found.");
               res.redirect("back");
           } else {
               // does user own the comment?
            if(foundComment.author.id.equals(req.user._id)) {
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

middlewareObj.checkUser = function(req, res, next) {
 if(req.isAuthenticated()){
        User.findById(req.params.id, function(err, foundUser){
           if(err || !foundUser){
               req.flash("error", err.message);
               res.redirect("/users/" + req.params.id);
           }  else {
            if(req.user && foundUser._id.equals(req.user._id)) {
                next();
            } else {
                req.flash("error", "You don't have permission to do that.");
                res.redirect("/users/" + req.params.id);
            }
           }
        });
    } else {
        req.flash("error", "You need to be logged in to do that.");
        res.redirect("/users/" + req.params.id);
    }
};

module.exports = middlewareObj;