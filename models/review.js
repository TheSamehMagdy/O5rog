var mongoose = require("mongoose");

// SCHEMA SETUP
var reviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        required: "Please provide a rating (1-5 stars).",
        min: 1,
        max: 5,
        // Adding validation to see if the entry is an integer
        validate: {
            // validator accepts a function definition which it uses for validation
            validator: Number.isInteger,
            message: "{VALUE} is not an integer."
        }
    },
    // review text
    text: {
        type: String
    },
    // author id and username fields
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    // place associated with the review
    place: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Place"
    }
}, {
    // assign createdAt and updatedAt fields with type: Date.
    timestamps: true
});

module.exports = mongoose.model("Review", reviewSchema);
