
var express    = require("express");
var app        = express();
var bodyParser = require("body-parser");
var mongoose   = require("mongoose");
var flash      =  require("connect-flash")
var passport   = require("passport");
var localStrategy = require("passport-local");
var methodOverride = require("method-override");
var Campground = require("./models/campground");
var Comment   = require("./models/comments");
var User      =  require("./models/user");
var seedDb     = require("./seeds");

var commentRoutes = require("./routes/comments")
var campgroundRoutes = require("./routes/campgrounds")
var authRoutes = require("./routes/auth")


mongoose.connect(process.env.DATABASEURL , {useNewUrlParser : true , useUnifiedTopology : true});

// mongoose.connect('mongodb+srv://kunalsinghal:9hqN51vsTORN9WH8@cluster0-jlomh.mongodb.net/test?retryWrites=true&w=majority' , {
// 	useNewUrlParser: true,
// 	useCreateIndex : true,
// 	useUnifiedTopology: true
	
// }) //.then(() => {
// 	console.log('connected to db');
// }).catch(err => {
// 	console.log('error detected', err.message);
// });


  //seedDb()

//SCHEMA SETUP


app.use(bodyParser.urlencoded({extended:true}));

app.set("view engine" , "ejs");

app.use(express.static(__dirname + "/public"))

app.use(methodOverride("_method"))
//PASSPORT CONFIGURATION

app.use(flash());


app.use(require("express-session")({
	secret : "Rusty is a dog",
	resave : false , 
	saveUninitialized: false
}))


app.use(passport.initialize())
app.use(passport.session());

passport.use(new localStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res ,next){
	res.locals.currentUser = req.user;
	res.locals.error  = req.flash("error")
	res.locals.success  = req.flash("success")

	next()
})


app.use(authRoutes);
app.use("/campgrounds" , campgroundRoutes);
app.use("/campgrounds/:id/comments" , commentRoutes);


app.listen(process.env.PORT||3000 , function(req , res){
	
	console.log("Started");
	
} )