
var express = require("express")
var router = express.Router({mergeParams : true})
var Campground = require("../models/campground")
var Comment = require("../models/comments")
var middleware  = require("../middleware")


//new comments
router.get("/new", middleware.isLoggedIn , function(req,res){
	
	Campground.findById(req.params.id , function(err , campground){ 
		
   if(err){
	   console.log(err)
   } else {
	   res.render("comments/new" , {campground : campground});
       }
	
	})
	
	
})


router.post("/" ,  middleware.isLoggedIn, function(req,res){
	
	// looking for a campground id 
	
	Campground.findById(req.params.id , function(err , campground){
		if(err){
			console.log(err);
			res.redirect("/campgrounds")
		} else {
		
			Comment.create(req.body.comment , function(err , comment){
				if(err){
					console.log(err);
				} else {
					
					//add username and id to comment
					
					comment.author.id = req.user._id;
					comment.author.username = req.user.username
                     					
					//save comment
					comment.save()
					
					campground.comments.push(comment);
					campground.save()
					req.flash("success" , "Successfully added Comment")
					res.redirect('/campgrounds/' + campground._id)
					
				}
			})
			
		}
	})
	
	// create new comment 
	
	// connect comment to campground
	
	// redirect to the specific id campground page
	
	
})


router.get("/:comments_id/edit", middleware.checkCommentsOwnership , function(req,res){
	
	Comment.findById(req.params.comments_id , function(err , foundComment){
		if(err){
			res.redirect("back")
		} else {
     	res.render("comments/edit" , {campground_id : req.params.id  , comment : foundComment})
			
		}
	})
	
})

router.put("/:comments_id" , middleware.checkCommentsOwnership , function(req,res){
	Comment.findByIdAndUpdate(req.params.comments_id , req.body.comment ,function(err , updateComment){
		if(err){
			res.redirect("back")
		} else {
			res.redirect("/campgrounds/"  + req.params.id)
		}
	})
})


router.delete("/:comments_id", middleware.checkCommentsOwnership ,function(req,res){
	Comment.findByIdAndDelete(req.params.comments_id , function(err , deletedComment){
		if(err){
			res.redirect("back")
		} else {
			req.flash("success"  , "Comment deleted")
			res.redirect("/campgrounds/"  + req.params.id)
		}
	})
})



module.exports = router