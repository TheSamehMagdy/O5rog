var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    email: String,
    password: String,
    firstName: String,
    lastName: String,
    username: String,
    avatar: String,
    avatarId: String,
    facebookId: String,
    token: String
});

UserSchema.plugin(passportLocalMongoose, {usernameField: "email"});

module.exports = mongoose.model("User", UserSchema);