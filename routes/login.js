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
	// username: req.body.loginUsername
	// password: req.body.loginPassword
	authController.validateInputBeforeLogin(req.body.loginUsername, req.body.loginPassword, function (errMsg) {
		// has error msg
		if (Object.getOwnPropertyNames(errMsg).length !== 0) {
			req.title = 'Charsabit - Login Error';
		}
		req.errMsg = errMsg;
		next();
	})
}

// check username availability and password match
function checkUsernameAndPasswordMatch (req, res, next) {
	// if username doesn't has errMsg
	if (!req.errMsg.hasOwnProperty('username')) {
		authController.isCorrectUsernamePassword('administrator', req.body.loginUsername, req.body.loginPassword, function (errMsg) {
			// has error msg
			if (Object.getOwnPropertyNames(errMsg).length !== 0) {
				req.title = 'Charsabit - Login Error';

				req.errMsg.username = errMsg.username;
				req.errMsg.password = errMsg.password;

				// render error msg to view
				res.render('login', { title: req.title, msg: req.errMsg, data: {
				username: req.body.loginUsername,
				password: req.body.loginPassword } });
			} else {
				next();		
			}
		});
	} else {
		// username has errMsg, render error msg to view
		res.render('login', { title: req.title, msg: req.errMsg, data: {
		username: req.body.loginUsername,
		password: req.body.loginPassword } });
	}
}

// login adminstrator, set online the dashboard
function loginAdministrator (req, res, next) {
	authController.loginAdministrator(req.body.loginUsername, function (err, data) {
		if (err) return next(new Error('DB error'));
		// administrator already online (use by other device or browser)
		if (!data.success) {
			res.redirect('/login/'+ req.body.loginUsername + '/has-logged-in');
		} else {
			req.idUsername = data.idUsername;
			req.idDashboard = data.idDashboard;
			next();
		}
	})
}

// create session
// sess = {
//		idUsername: 558755d5e23f3a68068f1aec_ina,  //idDashboard + username
//		idDashboard: 558755d5e23f3a68068f1aec
// }
function createSession (req, res, next) {
	sess = req.session;
	sess.idUsername = req.idUsername;
	sess.idDashboard = req.idDashboard;
	// redirect to dashboard
	res.redirect('/dashboard/'+ req.body.loginUsername);
}

//-------------------------------GET middlewares---------------------------------------
// validate username params in req URL
function validateUsernameParam (req, res, next) {
	authController.getAdministrator(req.params.username, function (err, user) {
		if (err) return next(new Error('DB error'));
		if (user) {
			next();
		} else {
			// return err 404 if there is no administrator with that params
			var err = new Error('Not Found');
		  err.status = 404;
		  next(err);
		}
	})
}

// check session availability
function sessionExists (req, res, next) {
	sess = req.session;
	// redirect to widget or dashboard
	if (sess.idUsername) {
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
	  res.render('login', { title: 'Charsabit - Login' });
	})

	.post(sessionExists, validation, checkUsernameAndPasswordMatch, loginAdministrator, createSession);

// success signup
router.route('/:username')
	.get(sessionExists, validateUsernameParam, function (req, res, next) {
		res.render('login', { title: 'Charsabit - Login', warning: {
			warningType: 'alert-success',
			warningMsg: 'Your account has been created.' 
		}, username: req.params.username });
	})

	.post(sessionExists, validation, checkUsernameAndPasswordMatch, loginAdministrator, createSession);

// has logged in
router.route('/:username/has-logged-in')
	.get(sessionExists, validateUsernameParam, function (req, res, next) {
		res.render('login', { title: 'Charsabit - Login', warning: {
			warningType: 'alert-warning',
			warningMsg: req.params.username + ' has logged-in.' 
		}, username: req.params.username });
	})

	.post(sessionExists, validation, checkUsernameAndPasswordMatch, loginAdministrator, createSession);



module.exports = router;
