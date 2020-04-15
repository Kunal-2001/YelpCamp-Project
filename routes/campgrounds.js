
var express = require("express")
var router = express.Router()
var Campground = require("../models/campground")
var middleware  = require("../middleware")



router.get("/" , function(req , res){
	// // LOCUS FREEZES THE CODE TO RENDER WHEN A REQUEST HAS BEEN SENT
	// eval(require("locus"));
// 	FIND ALL THE CAMPFROUND IN THE DATABASE
	    var noMatch = null;

	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		
			Campground.find({name : regex} , function(err , allCampgrounds){
		if(err){
			console.log("ERROR DETECTED");
		}else{
			
			if(allCampgrounds.length < 1){
				 noMatch = "No results found "
			}
			res.render("campgrounds/Index" , {campgrounds : allCampgrounds  , noMatch : noMatch} )
		}
		
	})
		
	} else {
	Campground.find({} , function(err , allCampgrounds){
		if(err){
			console.log("ERROR DETECTED");
		}else{
			res.render("campgrounds/Index" , {campgrounds : allCampgrounds , noMatch :noMatch} )
		}
		
	})
	}
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


// Campground Like Route
router.post("/:id/like", middleware.isLoggedIn, function (req, res) {
    Campground.findById(req.params.id, function (err, foundCampground) {
        if (err) {
            console.log(err);
            return res.redirect("/campgrounds");
        }

        // check if req.user._id exists in foundCampground.likes
        var foundUserLike = foundCampground.likes.some(function (like) {
            return like.equals(req.user._id);
        });

        if (foundUserLike) {
            // user already liked, removing like
            foundCampground.likes.pull(req.user._id);
        } else {
            // adding the new user like
            foundCampground.likes.push(req.user);
        }

        foundCampground.save(function (err) {
            if (err) {
                console.log(err);
                return res.redirect("/campgrounds");
            }
            return res.redirect("/campgrounds/" + foundCampground._id);
        });
    });
});



function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router