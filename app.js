require('dotenv').config();

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var flash = require('connect-flash');
var passport = require('passport');
var localStrategy = require('passport-local');
var methodOverride = require('method-override');
// var Campground = require('./models/campground');
// var Comment = require('./models/comments');
var User = require('./models/user');
// var seedDb = require('./seeds');
var commentRoutes = require('./routes/comments');
var campgroundRoutes = require('./routes/campgrounds');
var authRoutes = require('./routes/auth');
const expressSanitizer = require('express-sanitizer');

// var url = process.env.DATABASEURL || "mongodb://localhost/yelp_camp"
mongoose.connect('mongodb://localhost:27017/yelp_camp', { useNewUrlParser: true, useUnifiedTopology: true });

//SCHEMA SETUP

// seedDb();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));

app.use(methodOverride('_method'));
//PASSPORT CONFIGURATION

app.use(flash());
app.use(expressSanitizer());

app.use(
	require('express-session')({
		secret: 'Rusty is a dog',
		resave: false,
		saveUninitialized: false
	})
);

app.locals.moment = require('moment');

app.use(passport.initialize());
app.use(passport.session());

passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
	res.locals.currentUser = req.user;
	res.locals.error = req.flash('error');
	res.locals.success = req.flash('success');

	next();
});

app.use(authRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/comments', commentRoutes);

app.listen(process.env.PORT || 3000, function(req, res) {
	console.log('Started');
});
