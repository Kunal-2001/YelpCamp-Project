require('dotenv').config();

var express = require('express');
var router = express.Router();
var passport = require('passport');
var Campground = require('../models/campground');
var User = require('../models/user');
var middleware = require('../middleware');
var async = require('async');
var nodemailer = require('nodemailer');
var crypto = require('crypto');
// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = require('stripe')(process.env.STRIPE_API);

//requiring send grid mail service
const sgMail = require('@sendgrid/mail');
// var nodemailer = require('nodemailer');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.get('/', function(req, res) {
	res.render('temp');
});

// AUTH ROUTES

router.get('/register', function(req, res) {
	res.render('register');
});

router.post('/register', function(req, res) {
	function onSignIn(googleUser) {
		var profile = googleUser.getBasicProfile();
		console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
		console.log('Name: ' + profile.getName());
		console.log('Image URL: ' + profile.getImageUrl());
		console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
		// The ID token you need to pass to your backend:
		var id_token = googleUser.getAuthResponse().id_token;
		console.log('ID Token: ' + id_token);
	}
	function renderButton() {
		gapi.signin2.render('my-signin2', {
			scope: 'profile email',
			width: 240,
			height: 50,
			longtitle: true,
			theme: 'dark',
			onsuccess: onSuccess,
			onfailure: onFailure
		});
	}
	var newUser = new User({
		username: req.body.username,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		avatar: req.body.avatar,
		email: req.body.email
	});

	if (req.body.adminCode === process.env.IS_ADMIN) {
		newUser.isAdmin = true;
	}
	User.register(newUser, req.body.password, function(err, user) {
		if (err) {
			return res.render('register', { error: err.message });
		}

		passport.authenticate('local')(req, res, function() {
			req.flash('success', 'Welcome to YelpCamp ' + user.username);
			res.redirect('/campgrounds');
		});
	});
});

// login form

router.get('/login', function(req, res) {
	res.render('login');
});

router.post(
	'/login',
	passport.authenticate('local', {
		successRedirect: '/campgrounds',
		failureRedirect: '/login'
	}),
	function(req, res) {}
);

// LOGOUT

router.get('/logout', function(req, res) {
	req.logout();
	req.flash('success', 'Successfully Logged Out');
	res.redirect('/campgrounds');
});

// USER PROFILES

router.get('/users/:id', function(req, res) {
	User.findById(req.params.id, function(err, foundUser) {
		if (err) {
			req.flash('error', 'Something went wrong');
			res.redirect('back');
		}
		Campground.find().where('author.id').equals(foundUser._id).exec(function(err, campgrounds) {
			if (err) {
				req.flash('error', 'Something went wrong.');
				return res.redirect('/');
			}
			res.render('users/show', { user: foundUser, campgrounds: campgrounds });
		});
	});
});

// SENDING EMAIL FOR PASSWORD RESET

router.get('/forgot', function(req, res) {
	res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
	async.waterfall(
		[
			function(done) {
				crypto.randomBytes(20, function(err, buf) {
					var token = buf.toString('hex');
					done(err, token);
				});
			},
			function(token, done) {
				User.findOne({ email: req.body.email }, function(err, user) {
					if (!user) {
						req.flash('error', 'No account with that email address exists.');
						return res.redirect('/forgot');
					}

					user.resetPasswordToken = token;
					user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

					user.save(function(err) {
						done(err, token, user);
					});
				});
			},
			function(token, user, done) {
				var smtpTransport = nodemailer.createTransport({
					service: 'Gmail',
					auth: {
						user: 'kunal999936@gmail.com',
						pass: process.env.KUNALGMAIL
					}
				});
				var mailOptions = {
					to: user.email,
					from: 'kunal999936@gmail.com',
					subject: 'Node.js Password Reset',
					text:
						'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
						'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
						'http://' +
						req.headers.host +
						'/reset/' +
						token +
						'\n\n' +
						'If you did not request this, please ignore this email and your password will remain unchanged.\n'
				};
				smtpTransport.sendMail(mailOptions, function(err) {
					console.log('mail sent');
					req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
					done(err, 'done');
				});
			}
		],
		function(err) {
			if (err) return next(err);
			res.redirect('/forgot');
		}
	);
});

router.get('/reset/:token', function(req, res) {
	User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(
		err,
		user
	) {
		if (!user) {
			req.flash('error', 'Password reset token is invalid or has expired.');
			return res.redirect('/forgot');
		}
		res.render('reset', { token: req.params.token });
	});
});

router.post('/reset/:token', function(req, res) {
	async.waterfall(
		[
			function(done) {
				User.findOne(
					{ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } },
					function(err, user) {
						if (!user) {
							req.flash('error', 'Password please reset token is invalid or has expired.');
							return res.redirect('back');
						}
						if (req.body.password === req.body.confirm) {
							user.setPassword(req.body.password, function(err) {
								user.resetPasswordToken = undefined;
								user.resetPasswordExpires = undefined;

								user.save(function(err) {
									req.logIn(user, function(err) {
										done(err, user);
									});
								});
							});
						} else {
							req.flash('error', 'Passwords do not match.');
							return res.redirect('back');
						}
					}
				);
			},
			function(user, done) {
				var smtpTransport = nodemailer.createTransport({
					service: 'Gmail',
					auth: {
						user: 'kunal999936@gmail.com',
						pass: process.env.KUNALGMAIL
					}
				});
				var mailOptions = {
					to: user.email,
					from: 'kunal999936@mail.com',
					subject: 'Your password has been changed',
					text:
						'Hello,\n\n' +
						'This is a confirmation that the password for your account ' +
						user.email +
						' has just been changed.\n'
				};
				smtpTransport.sendMail(mailOptions, function(err) {
					req.flash('success', 'Success! Your password has been changed.');
					done(err);
				});
			}
		],
		function(err) {
			res.redirect('/campgrounds');
		}
	);
});

router.get('/checkout', async (req, res) => {
	try {
		const paymentIntent = await stripe.paymentIntents.create({
			amount: 30000,
			currency: 'usd',
			// Verify your integration in this guide by including this parameter
			metadata: { integration_check: 'accept_a_payment' }
		});
		res.render('checkout', { client_secret: paymentIntent.client_secret });
	} catch (error) {
		req.flash('error', error.message);
		res.redirect('back');
	}
});

router.get('/contact', middleware.isLoggedIn, (req, res) => {
	res.render('contact');
});

router.post('/contact', async (req, res) => {
	let { name, email, message } = req.body;
	name = req.sanitize(name);
	email = req.sanitize(email);
	message = req.sanitize(message);
	const msg = {
		to: 'kunal999936@gmail.com',
		from: email,
		subject: `YelpCamp Contact Form Submission from ${name}`,
		text: message,
		html: `
    <h1>Hi there, this email is from, ${name}</h1>
    <p>${message}</p>
    `
	};
	try {
		await sgMail.send(msg);
		req.flash('success', 'Thank you for your email, we will get back to you shortly.');
		res.redirect('/contact');
	} catch (error) {
		console.error(error);
		if (error.response) {
			console.error(error.response.body);
		}
		req.flash('error', 'Sorry, something went wrong, please contact admin@website.com');
		res.redirect('back');
	}
	// 	var transporter = nodemailer.createTransport({
	// 		service: 'gmail',
	// 		auth: {
	// 			user: 'kunal999936@gmail.com',
	// 			pass: 'Player@109'
	// 		}
	// 	});
	// 	var mailOptions = {
	// 		from: req.body.email,
	// 		to: 'kunal999936@gmail.com',
	// 		subject: 'Sending Email using Node.js',
	// 		text: 'That was easy!'
	// 	};
	// 	transporter.sendMail(mailOptions, function(error, info) {
	// 		if (error) {
	// 			console.log(error);
	// 		} else {
	// 			console.log('Email sent: ' + info.response);
	// 		}
	// 	});
});

module.exports = router;
