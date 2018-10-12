var mongoose = require("mongoose");
var Comment = require("./comment");
var Review = require("./review");

// SCHEMA SETUP
var placeSchema = new mongoose.Schema({
    name: String,
    address: String,
    image: String,
    imageId: String,
    description: String,
    createdAt: {type: Date, default: Date.now},
    recoms: Number,
    recomUsers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"    
        }    
    ],
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    rating: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model("Place", placeSchema);