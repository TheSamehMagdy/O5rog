var express        = require("express"),
    app            = express(),
    bodyParser     = require("body-parser"),
    mongoose       = require("mongoose"),
    flash          = require("connect-flash"),
    passport       = require("passport"),
    LocalStrategy  = require("passport-local"),
    methodOverride = require("method-override"),
    User           = require("./models/user"),
    Place          = require("./models/place");
    
// Requiring routes
var indexRoutes      = require("./routes/index");
var placeRoutes      = require("./routes/places");
var commentRoutes    = require("./routes/comments");

// Set up database env variable
var url = process.env.DATABASEURL || "mongodb://localhost/egyplaces";

mongoose.connect(url, {useNewUrlParser: true});
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require("moment");

app.use(require("express-session")({
    secret: "In brightest day, in blackest night, no evil shall escape my sight.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use(indexRoutes);
app.use(placeRoutes);
app.use(commentRoutes);

// Start server
app.listen(process.env.PORT, process.env.IP, function() {
    console.log("Server has started");
});