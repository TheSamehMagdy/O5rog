var mongoose = require("mongoose");

// SCHEMA SETUP
var placeSchema = new mongoose.Schema({
    name: String,
    address: String,
    image: String,
    description: String,
    createdAt: {type: Date, default: Date.now},
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});

module.exports = mongoose.model("Place", placeSchema);