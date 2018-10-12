var Place   = require("../models/place");
var Comment = require("../models/comment");
var User    = require("../models/user");
var Review = require("../models/review");

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

middlewareObj.checkReviewOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        Review.findById(req.params.review_id, function(err, foundReview){
            if(err || !foundReview){
                res.redirect("back");
            }  else {
                // does user own the review?
                if(foundReview.author.id.equals(req.user._id)) {
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

middlewareObj.checkReviewExistence = function (req, res, next) {
    if (req.isAuthenticated()) {
        Place.findById(req.params.id).populate("reviews").exec(function (err, foundPlace) {
            if (err || !foundPlace) {
                req.flash("error", "Place not found.");
                res.redirect("back");
            } else {
                // check if req.user._id exists in foundPlace.reviews
                var foundUserReview = foundPlace.reviews.some(function (review) {
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "You already wrote a review.");
                    return res.redirect("back");
                }
                // if the review was not found, go to the next middleware
                next();
            }
        });
    } else {
        req.flash("error", "You need to login first.");
        res.redirect("back");
    }
};

module.exports = middlewareObj;