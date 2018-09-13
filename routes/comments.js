var express = require("express");
var router  = express.Router();
var Place = require("../models/place");
var Comment = require("../models/comment");
var middleware = require("../middleware");

// Comments New
router.get("/:id/comments/new", middleware.isLoggedIn, function(req, res) {
    // Find place by id
    Place.findById(req.params.id, function(err, place){
        if(err) {
            req.flash("error", "Couldn't add comment.");
            res.redirect("back");
        } else {
             res.render("comments/new", {place: place});
        }
    });
});

// Comments Create
router.post("/:id/comments", middleware.isLoggedIn, function(req, res){
    // Lookup place using ID
    Place.findById(req.params.id, function(err, place) {
       if(err) {
           req.flash("error", "Place not found.");
           res.redirect("/");
       } else {
           // Create new comment
           Comment.create(req.body.comment, function(err, comment){
              if(err) {
                  req.flash("error", "Couldn't add comment.");
                  res.redirect("back");
              } else {
                  // Add username and id to comment
                  comment.author.id = req.user._id;
                  comment.author.username = req.user.firstName + " " + req.user.lastName;
                  // Save comment
                  comment.save();
                  // Connect new comment to place
                  place.comments.push(comment);
                  place.save();
                  // redirect to place show page
                  req.flash("success", "Comment added successfully.");
                  res.redirect("/" + place._id);
              }
           });
       }
    });
});

// COMMENTS EDIT
router.get("/:id/comments/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
    Place.findById(req.params.id, function(err, foundPlace) {
        if(err || !foundPlace){
            req.flash("error", "Place not found.");
            return res.redirect("back");
        }    
        Comment.findById(req.params.comment_id, function(err, foundComment) {
            if(err) {
                res.redirect("back");
            } else {
                res.render("comments/edit", {place: foundPlace, place_id: req.params.id, comment: foundComment});    
            }
        });
    });
});

// COMMENTS UPDATE
router.put("/:id/comments/:comment_id/", middleware.checkCommentOwnership, function(req, res){
   Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
       if(err){
           res.redirect("back");
       } else {
           res.redirect("/" + req.params.id);
       }
   });
});

// COMMENTS DESTROY
router.delete("/:id/comments/:comment_id/", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err) {
            res.redirect("back");
        } else {
            req.flash("success", "Comment deleted.");
            res.redirect("/" + req.params.id);
        }
    });
});

module.exports = router;