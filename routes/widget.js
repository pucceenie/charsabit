var express = require('express');
var router = express.Router();

var session = require('express-session');

var sess;

var User = require('../models/user');
var Dashboard = require('../models/dashboard');
var Widget = require('../models/widget');
var Visitor = require('../models/visitor');
var Message = require('../models/message');

var session = require('express-session');

var sess;

var AuthCtrl = require('../controllers/AuthCtrl');
var WidgetCtrl = require('../controllers/WidgetCtrl');
var ChatCtrl = require('../controllers/ChatCtrl');
var authController = new AuthCtrl(User, Dashboard, Widget, Visitor);
var widgetController = new WidgetCtrl(User, Dashboard, Widget, Visitor);
var chatController = new ChatCtrl(Message);

//-------------------------------POST middlewares---------------------------------------
// ---- signup middleware ----

// validate user input
function validation (req, res, next) {
	// email: req.body.signupEmail
	// username: req.body.signupUsername
	// password: req.body.signupPassword
	// passwordRepeat: req.body.signupPasswordRepeat
	authController.validateInputBeforeRegister(req.body.signupEmail, req.body.signupUsername, 
		req.body.signupPassword, req.body.signupPasswordRepeat, function (errMsg) {
			req.title = 'Charsabit - Widget Sign Up';
			req.url = '/widget/'+ req.params.idWidget +'/login/'+ req.body.signupUsername;
			// has error msg
			if (Object.getOwnPropertyNames(errMsg).length !== 0) {
				req.title = 'Charsabit - Widget Signup Error';
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
				req.title = 'Charsabit - Widget Signup Error';
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
				req.title = 'Charsabit - Widget Signup Error';
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
	if (Object.getOwnPropertyNames(errmsg).length === 0) {
		// if there is no error msg
		authController.registerVisitor(req.body.signupEmail, req.body.signupUsername, req.body.signupPassword, function (err, visitor) {
			if (err) return next(new Error('DB error'));
			next();
		})
	} else {
		next();
	}
}

// ---- login middleware ----

// validate user input
function loginValidation (req, res, next) {
	// username: req.body.loginUsername
	// password: req.body.loginPassword
	authController.validateInputBeforeLogin(req.body.loginUsername, req.body.loginPassword, function (errMsg) {
		// has error msg
		if (Object.getOwnPropertyNames(errMsg).length !== 0) {
			req.title = 'Charsabit - Widget Login Error';
		}
		req.errMsg = errMsg;
		next();
	})
}

// check username availability and password match
function checkUsernameAndPasswordMatch (req, res, next) {
	// if username doesn't has errMsg
	if (!req.errMsg.hasOwnProperty('username')) {
		authController.isCorrectUsernamePassword('visitor', req.body.loginUsername, req.body.loginPassword, function (errMsg) {
			// has error msg
			if (Object.getOwnPropertyNames(errMsg).length !== 0) {
				req.title = 'Charsabit - Login Error';

				req.errMsg.username = errMsg.username;
				req.errMsg.password = errMsg.password;
				// render error msg to view
				res.render('widget-login', { title: req.title, msg: req.errMsg, data: {
					username: req.body.loginUsername,
					password: req.body.loginPassword
				}, idWidget: req.params.idWidget, widgetUrl: req.widgetUrl });
			} else {
				next();		
			}
		});
	} else {
		// render error msg to view
		res.render('widget-login', { title: req.title, msg: req.errMsg, data: {
			username: req.body.loginUsername,
			password: req.body.loginPassword 
		}, idWidget: req.params.idWidget, widgetUrl: req.widgetUrl });
	}
}

// login visitor, set online the visitor
function loginVisitor (req, res, next) {
	authController.loginVisitor(req.params.idWidget, req.body.loginUsername, function (err, data) {
		if (err) return next(new Error('DB error'));
		// visitor already online in this widget (use by other device or browser)
		if (!data.success) {
			res.redirect('/widget/' + req.params.idWidget + '/login/'+ req.body.loginUsername + '/has-logged-in');
		} else {
			req.idUsername = data.idUsername;
			req.idWidget = data.idWidget;
			req.idDashboard = data.idDashboard;
			next();
		}
	})
}

// create session
// sess = {
//		idUsername: 558755e9e23f3a68068f1aed_dimas,  //idWidget + username
//		idDashboard: 558755d5e23f3a68068f1aec,
// 		idWidget: 558755e9e23f3a68068f1aed,
// 		logout: false
// }
function createSession (req, res, next) {
	sess = req.session;
	sess.idUsername = req.idUsername;
	sess.idDashboard = req.idDashboard;
	sess.idWidget = req.idWidget;
	// redirect to widget chat
	res.redirect('/widget/'+ req.idWidget + '/chat/' + req.body.loginUsername);
}

//-------------------------------GET middlewares---------------------------------------
// check session availability (urL: /widget/:idWidget)
function sessionExists (req, res, next) {
	sess = req.session;
	// no session found, redirect to widget login
	if (!sess.idUsername) {
		res.redirect('/widget/'+ req.params.idWidget +'/login');
	} else {
		authController.sessionRedirect(sess.idUsername, function (err, redirect) {
			// redirect to dashboard
			if (/dashboard/.test(redirect)) {
				res.redirect(redirect);
			} else {
				var split = sess.idUsername.split('_');
				var id = split[0];
				var username = split[1];
				// get visitor detail
				widgetController.getVisitor(req.params.idWidget, username, function (err, visitor) {
					if (err) return next(new Error('DB error'));
					req.idUsernameAdministrator = visitor.idUsernameAdministrator;
					req.idUsername = sess.idUsername;
					req.unreadMsg = visitor.unreadWidgetMsg;
					// get dashboard status
					widgetController.getDashboardStatus(sess.idDashboard, function (err, status) {
						console.log(status);
						req.status = status;
						next();
					})
				})
			}
		})
	}
}

// check session availability (!url: /widget/:idWidget)
function sessionExists1 (req, res, next) {
	sess = req.session;
	// no session found
	if (!sess.idUsername) {
		next();
	} else {
		// redirect to dashboard/widget based on sess.idUsername
		authController.sessionRedirect(sess.idUsername, function (err, redirect) {
			res.redirect(redirect);
		})
	}
}

// get widget detail
function getWidget (req, res, next) {
	// if idWidget !== 24, return not found
	if (req.params.idWidget.length !== 24) {
		var err = new Error('Not Found');
		err.status = 404;
		next(err);
	} else {
		widgetController.getWidgetDetail(req.params.idWidget, function (err, widget) {
			if (err) return next(new Error('DB error'));
			if (widget) {
				req.widgetUrl = widget.url;
				next();
			} else {
				// return not found if idWidget not found in db
				var err = new Error('Not Found');
				err.status = 404;
				next(err);
			}
		})
	}
}

// validate username params in req URL
function validateUsernameParam (req, res, next) {
	authController.getVisitor(req.params.username, function (err, user) {
		if (err) return next(new Error('DB error'));
		if (user) {
			next();
		} else {
			// return err 404 if there is no visitor with that params
			var err = new Error('Not Found');
		  err.status = 404;
		  next(err);
		}
	})
}

// logout visitor
function logoutVisitor (req, res, next) {
	sess = req.session;
	var split = sess.idUsername.split('_');
	var id = split[0];
	var username = split[1];
	authController.logoutVisitor(id, username, function (err, visitor) {
		if (err) return next(new Error('DB error'));
		req.idUsername = sess.idUsername;
		req.idWidget = sess.idWidget;
		req.idDashboard = sess.idDashboard;
		sess.destroy();
		next();
	})
}




//----------------------------------routes---------------------------------------------

router.route('/:idWidget')
	.get(sessionExists1, getWidget, function (req, res, next) {
		res.redirect('/widget/'+ req.params.idWidget +'/login');
		res.end();
	});

// widget chat route
router.route('/:idWidget/chat/:username')
	.get(sessionExists, getWidget, function (req, res, next) {
		res.render('widget-chat', { title: 'Charsabit - Widget Chat', 
			idWidget: req.params.idWidget, 
			widgetUrl: req.widgetUrl,
			idUsername: req.idUsername,
			idUsernameAdministrator: req.idUsernameAdministrator,
			adminStatus: req.status,
			unreadMsg: req.unreadMsg })
	});

// signup route
router.route('/:idWidget/signup')
	.get(sessionExists1, getWidget, function (req, res, next) {
		res.render('widget-signup', { title: 'Charsabit - Widget Signup', idWidget: req.params.idWidget, widgetUrl: req.widgetUrl } )
	})
	.post(sessionExists1, validation, checkEmailAvailability, checkUsernameAvailability, saveUser, function (req, res, next) {
		res.render('widget-signup', { title: req.title, msg: req.errMsg, data: {
			email: req.body.signupEmail,
			username: req.body.signupUsername, 
			password: req.body.signupPassword, 
			passwordRepeat: req.body.signupPasswordRepeat
		}, idWidget: req.params.idWidget, widgetUrl: req.widgetUrl, url: req.url });
	});

// login route
router.route('/:idWidget/login')
	.get(sessionExists1, getWidget, function (req, res, next) {
		res.render('widget-login', { title: 'Charsabit - Widget Login', idWidget: req.params.idWidget, widgetUrl: req.widgetUrl } )
	})
	.post(sessionExists1, loginValidation, checkUsernameAndPasswordMatch, loginVisitor, createSession);

// signup success
router.route('/:idWidget/login/:username')
	.get(sessionExists1, getWidget, validateUsernameParam, function (req, res, next) {
		res.render('widget-login', { title: 'Charsabit - Widget Login', idWidget: req.params.idWidget, widgetUrl: req.widgetUrl, warning: {
			warningType: 'alert-success',
			warningMsg: 'Your account has been created.' 
		}, username: req.params.username } )
	})
	.post(sessionExists1, loginValidation, checkUsernameAndPasswordMatch, loginVisitor, createSession);

// visitor has logged in
router.route('/:idWidget/login/:username/has-logged-in')
	.get(sessionExists1, getWidget, validateUsernameParam, function (req, res, next) {
		res.render('widget-login', { title: 'Charsabit - Widget Login', idWidget: req.params.idWidget, widgetUrl: req.widgetUrl, warning: {
			warningType: 'alert-warning',
			warningMsg: req.params.username + ' has logged-in.'
		}, username: req.params.username } )
	})
	.post(sessionExists1, loginValidation, checkUsernameAndPasswordMatch, loginVisitor, createSession);

// logout route
router.route('/:idWidget/logout')
	.get(logoutVisitor, function (req, res, next) {
		res.render('widget-logout', { idWidget: req.idWidget, idUsername: req.idUsername, idDashboard: req.idDashboard });
		//res.redirect('/widget/'+ req.params.idWidget +'/login');
	});


module.exports = router;