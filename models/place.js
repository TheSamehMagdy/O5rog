var mongoose = require("mongoose");

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
    ]
});

module.exports = mongoose.model("Place", placeSchema);