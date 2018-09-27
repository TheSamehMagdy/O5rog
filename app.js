var express          = require("express"),
    app              = express(),
    bodyParser       = require("body-parser"),
    mongoose         = require("mongoose"),
    flash            = require("connect-flash"),
    passport         = require("passport"),
    LocalStrategy    = require("passport-local"),
    FacebookStrategy = require('passport-facebook').Strategy,
    methodOverride   = require("method-override"),
    User             = require("./models/user"),
    Place            = require("./models/place");

require('dotenv').config();

// Requiring routes
var indexRoutes      = require("./routes/index");
var placeRoutes      = require("./routes/places");
var commentRoutes    = require("./routes/comments");

// Set up database env variable
var url = process.env.DATABASEURL || "mongodb://localhost/o5rog";

mongoose.connect(url, {useNewUrlParser: true});
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require("moment");

app.use(require("express-session")({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Passport Configuration 
app.use(passport.initialize());
app.use(passport.session());

    // Passport Local
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },  
  function(email, password, done) {
    User.findOne({ email: email }, function(err, user) {
      if (err) { return done(err); }
      return done(null, user);
    });
  }
));

    //Passport Facebook
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK,
    profileFields: ["id", "displayName", "name", "emails", "picture.width(800)"]
  },
  function(accessToken, refreshToken, profile, done) {
    var me = new User({
			email: profile.emails[0].value,
			username: profile.displayName,
			firstName: profile.name.givenName,
			lastName: profile.name.familyName,
			avatar: profile.photos[0].value
		});
    User.findOne({email:me.email}, function(err, u) {
			if(!u) {
				me.save(function(err, me) {
					if(err) return done(err);
					done(null, me);
				});
			} else {
				done(null, u);
			}
		});
  }
));

passport.use(LocalStrategy);
User.createStrategy();
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