
var express = require("express")
var router = express.Router()
var Campground = require("../models/campground")
var middleware  = require("../middleware")



router.get("/" , function(req , res){
	
// 	FIND ALL THE CAMPFROUND IN THE DATABASE
	
	Campground.find({} , function(err , allCampgrounds){
		if(err){
			console.log("ERROR DETECTED");
		}else{
			res.render("campgrounds/Index" , {campgrounds : allCampgrounds } )
		}
		
	})
	
// res.render("campgrounds" , {campgrounds: campgrounds});
})



router.post("/" , middleware.isLoggedIn,  function(req , res){
	
	var name = req.body.name;
	var price = req.body.price;
	var image = req.body.image;
	var desc  = req.body.description;
	var author = {
		id : req.user._id,
		username : req.user.username
	}
	var newCampground = {name : name , price : price , image : image , description : desc , author : author};
	
	
	
	Campground.create(newCampground , function(err , newlyCreatedCampground){
		
		if(err){
        console.log(err);
		}else{
	    res.redirect("/campgrounds");
		}	
	})
})

router.get("/new" , middleware.isLoggedIn , function(req ,res){
	
	res.render("campgrounds/new");
	
})

router.get("/:id" , function(req ,res){
	
	Campground.findById(req.params.id).populate("comments").exec(function(err , foundCampground){
		
		if(err){
			console.log(err);
		}else{
			
			res.render("campgrounds/show" , {campground : foundCampground});
		}
		
	});	
});


// EDIT Campground
router.get("/:id/edit" , middleware.isUserAuthorisedCampground , function(req ,res){

		  Campground.findById(req.params.id , function(err , foundCampground){
		
       				res.render("campgrounds/edit" , {campground  : foundCampground })	 
              })
         })

router.put("/:id" , middleware.isUserAuthorisedCampground ,function(req,res){
	Campground.findByIdAndUpdate( req.params.id , req.body.campground , function(err , updatedCampground){
	       if(err){
			   res.redirect("/campgrounds")
		   }else{
			   res.redirect("/campgrounds/" + updatedCampground._id)
		   }
	})
})


// DESTROY CAMPGROUND

router.delete("/:id" , middleware.isUserAuthorisedCampground ,function(req,res){
	
	Campground.findByIdAndRemove( req.params.id  , function(err) {
		
		if(err){
			res.redirect("/campgrounds")
		} else {
			res.redirect("/campgrounds")
		}
		
	})
	
	
})






module.exports = router