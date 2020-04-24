var Campground = require('../models/campground');
var Comment = require('../models/comments');

var middlewareObj = {};

middlewareObj.isUserAuthorisedCampground = function(req, res, next) {
	// is user logged in
	if (req.isAuthenticated()) {
		Campground.findById(req.params.id, function(err, foundCampground) {
			if (err) {
				req.flash('error', 'campground not found');
				res.redirect('back');
			} else {
				/// we did'nt do === as one is string and one is an object so that is replaced by .equals()
				if (foundCampground.author.id.equals(req.user._id) || req.user.isAdmin) {
					next();
				} else {
					req.flash('error', "You Don't have permission to do that");

					res.redirect('back');
				}
			}
		});
	} else {
		req.flash('error', 'You need to be Logged In');
		res.redirect('back');
	}
};

middlewareObj.checkCommentsOwnership = function(req, res, next) {
	// is user logged in
	if (req.isAuthenticated()) {
		Comment.findById(req.params.comments_id, function(err, foundComment) {
			if (err) {
				res.redirect('back');
			} else {
				/// we did'nt did === as one is string and one is an object so that is replaced by .equals()

				if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
					next();
				} else {
					req.flash('error', "You Don't have permission to do that");
					res.redirect('back');
				}
			}
		});
	} else {
		req.flash('error', 'You need to be Logged In');
		res.redirect('back');
	}
};

middlewareObj.isLoggedIn = function(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	req.flash('error', 'Please Login to continue');
	res.redirect('/login');
};

module.exports = middlewareObj;
