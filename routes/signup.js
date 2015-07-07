var express = require('express');
var router = express.Router();
var session = require('express-session');
var sess;

var User = require('../models/user');
var Dashboard = require('../models/dashboard');
var Widget = require('../models/widget');
var Visitor = require('../models/visitor');

var AuthCtrl = require('../controllers/AuthCtrl');
var authController = new AuthCtrl(User, Dashboard, Widget, Visitor);


//-------------------------------POST middlewares---------------------------------------
// validate user input
function validation (req, res, next) {
	// email: req.body.signupEmail
	// username: req.body.signupUsername
	// password: req.body.signupPassword
	// passwordRepeat: req.body.signupPasswordRepeat
	authController.validateInputBeforeRegister(req.body.signupEmail, req.body.signupUsername, 
		req.body.signupPassword, req.body.signupPasswordRepeat, function (errMsg) {
			req.title = 'Charsabit - Signup';
			req.url = '/login/'+ req.body.signupUsername;
			// has error msg
			if (Object.getOwnPropertyNames(errMsg).length !== 0) {
				req.title = 'Charsabit - Signup Error';
				req.url = '';
			}
		req.errMsg = errMsg;
		next();
	})
}

// check email availability in db
function checkEmailAvailability (req, res, next) {
	// if email doesn't has errMsg
	if (!req.errMsg.hasOwnProperty('email')) {
		authController.isAvailableEmail(req.body.signupEmail, function (errMsg) {
			// has error msg
			if (Object.getOwnPropertyNames(errMsg).length !== 0) {
				req.title = 'Charsabit - Signup Error';
				req.url = '';
				req.errMsg.email = errMsg.email;
			}
			next();
		});
	} else {
		next();
	}
}

// check username availability in db
function checkUsernameAvailability (req, res, next) {
	// if username doesn't has errMsg
	if (!req.errMsg.hasOwnProperty('username')) {
		authController.isAvailableUsername(req.body.signupUsername, function (errMsg) {
			// has error msg
			if (Object.getOwnPropertyNames(errMsg).length !== 0) {
				req.title = 'Charsabit - Signup Error';
				req.url = '';
				req.errMsg.username = errMsg.username;
			}			
			next();
		});
	} else {
		next();
	}
}

// save new user object to db
function saveUser (req, res, next) {
	var errmsg = req.errMsg;
	// if there is no error msg
	if (Object.getOwnPropertyNames(errmsg).length === 0) {
		authController.registerAdministrator(req.body.signupEmail, req.body.signupUsername, req.body.signupPassword, function (err, numAffected) {
			if (err) return next(new Error('DB error'));
			next();
		})
	} else {
		next();
	}
}

//-------------------------------GET middlewares---------------------------------------
// check session availability
function sessionExists (req, res, next) {
	sess = req.session;

	if (sess.idUsername) {
		// redirect to widget or dashboard
		authController.sessionRedirect(sess.idUsername, function (err, redirect) {
			if (err) return next(new Error('DB error'));
			res.redirect(redirect);
		})
	} else {
		next();
	}
}

//----------------------------------routes---------------------------------------------
router.route('/')
	.get(sessionExists, function (req, res, next) {
	  res.render('signup', { title: 'Charsabit - Signup' });
	})

	.post(sessionExists, validation, checkEmailAvailability, checkUsernameAvailability, saveUser, function (req, res, next) {
		res.render('signup', { title: req.title, msg: req.errMsg, data: {
			email: req.body.signupEmail,
			username: req.body.signupUsername, 
			password: req.body.signupPassword, 
			passwordRepeat: req.body.signupPasswordRepeat
		}, url: req.url });
	})



module.exports = router;
