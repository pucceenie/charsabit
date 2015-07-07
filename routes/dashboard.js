var express = require('express');
var router = express.Router();

var session = require('express-session');

var sess;

var User = require('../models/user');
var Dashboard = require('../models/dashboard');
var Widget = require('../models/widget');
var Visitor = require('../models/visitor');
var Message = require('../models/message');

var AuthCtrl = require('../controllers/AuthCtrl');
var DashboardCtrl = require('../controllers/DashboardCtrl');
var ChatCtrl = require('../controllers/ChatCtrl');
var authController = new AuthCtrl(User, Dashboard, Widget, Visitor);
var dashboardController = new DashboardCtrl(User, Dashboard, Widget, Visitor);
var chatController = new ChatCtrl(Message);

//-------------------------------POST middlewares---------------------------------------
// validate user input
function validateURL (req, res, next) {
	// url: req.body.websiteUrl
	dashboardController.validateInputBeforeGenerate(req.body.websiteUrl, function (errMsg) {
		// has error msg
		if (Object.getOwnPropertyNames(errMsg).length !== 0) {
			// render view with error msg
			res.render('dashboard-setting-widget', { title: 'Charsabit - Error Generate Widget Code',
		  	displayName: req.username,
		  	idUser: req.idUser.toString(),
		  	username: req.username,
		  	widgetVisitors: req.visitorList,
		  	widgets: req.widgetList,
		  	msg: errMsg.url,
		  	url: req.body.websiteUrl
	   	});
		} else {
			// render view with error msg
			dashboardController.isAvailableURL(req.body.websiteUrl, function (errMsg1) {
				if (Object.getOwnPropertyNames(errMsg1).length !== 0) {
					res.render('dashboard-setting-widget', { title: 'Charsabit - Error Generate Widget Code',
				  	displayName: req.username,
				  	idUser: req.idUser.toString(),
				  	username: req.username,
				  	widgetVisitors: req.visitorList,
				  	widgets: req.widgetList,
				  	msg: errMsg1.url,
				  	url: req.body.websiteUrl
			   	});
			  } else {
			  	next();
			  }
			});
		}
	})
}

// generate widget to displayed in preview
function generateWidget (req, res, next) {
	dashboardController.generateWidget(req.idDashboard, req.body.websiteUrl, function (err, widgetCode) {
		if (err) return next(new Error('DB error'));
		// return the widget script
		req.widgetScript = widgetCode;
		next();
	})
}

//-------------------------------GET middlewares---------------------------------------
// check session availability
function sessionExists (req, res, next) {
	sess = req.session;
	// redirect to landing page
	if (!sess.idUsername) {
		res.redirect('/');
	} else {
		authController.sessionRedirect(sess.idUsername, function (err, redirect) {
			// redirect to widget
			if (/widget/.test(redirect)) {
				res.redirect(redirect);
			} else {
				next();
			}
		})
	}
}

// get user info
// user = {
// 		_id: ab8755d5e23f3a68068ff123
// 		username: 'ina',
//		idDashboard: 558755d5e23f3a68068f1aec
// }
function getUser (req, res, next) {
	authController.getAdministrator(req.params.username, function (err, user) {
		if (err) return next(new Error('DB error'));
		// return user obj
		if (user) {
			req.idUser = user._id;
			req.username = user.username;
			req.idDashboard = user.idDashboard;
			next();
		} else {
			// username not found
			var err = new Error('Not Found');
		  err.status = 404;
		  next(err);
		}
	})
}

// get visitorList
// visitorList = [
//		{
//			_id: ab8755d5e23f3a68068ff123,
//			url: 'http://example.com',
//			visitors: {
// 				username: 'dimas',
//				status: 'online',
//				unreadMsg: [ab8755d5e23f3a68068ff144, ab8755d5e23f3a68068ff155]
//			}
// 		}, {...}
// ]
function getVisitorList (req, res, next) {
	dashboardController.getVisitorList(req.idDashboard, function (err, visitorList) {
		if (err) return next(new Error('DB error'));
		req.visitorList = visitorList;
		next();
	})
}

// ---- setting widget middleware ----

// get widgetList
// widgetList = [{
// 		url: 'http://example.com',
//		widgetCode: '<!--Start of Charsabit Live Chat Script--><script type="text/javascript">function create(htmlStr) {
// 			var frag = document.createDocumentFragment(),temp = document.createElement('div');
//			temp.innerHTML = htmlStr; while (temp.firstChild) {frag.appendChild(temp.firstChild);} return frag;}
// 			var fragment = create('<div id="charsabit-widget-link" style="position: fixed; bottom: 10px; right: 0">
// 			<a href="http://localhost:3000/widget/558755e9e23f3a68068f1aed" target="_blank"><img src="http://localhost:3000/data/
// 			chat-widget-ico-hover.png" height="100px" width="100px" /></a></div>');
//			document.body.insertBefore(fragment, document.body.childNodes[0]);</script><!--End of Charsabit Live Chat Script-->'	
// }, {...}]
function getWidgetList (req, res, next) {
	dashboardController.getWidgetList(req.idDashboard, function (err, widgetList) {
		if (err) return next(new Error('DB error'));
		req.widgetList = widgetList;
		next();
	})
}

// ---- chat middleware ----

//get visitor status ('online'/'offline')
function getVisitorStatus (req, res, next) {
	dashboardController.getVisitorStatus(req.params.idWidget, req.params.vUsername, function (err, status) {
		if (err) return next(new Error('DB error'));
		req.vStatus = status;
		next();
	});
}

// ---- logout middleware ----

function logoutAdministrator (req, res, next) {
	sess = req.session;
	authController.logoutAdministrator(sess.idDashboard, function (err, dashboard) {
		if (err) return next(new Error('DB error'));
		req.idDashboard = sess.idDashboard;
		req.idUsername = sess.idUsername;
		sess.destroy();
		next();
	});
}

//----------------------------------routes---------------------------------------------
// dashboard home route
router.route('/:username')
	.get(sessionExists, getUser, getVisitorList, function (req, res, next) {
	  res.render('dashboard-home', { title: 'Charsabit - Dashboard',
	  	displayName: req.username,
	  	idUser: req.idUser.toString(),
	  	username: req.username,
	  	widgetVisitors: req.visitorList
	   });
	});

// dashboard setting widget route
router.route('/:username/setting-widget')
	.get(sessionExists, getUser, getVisitorList, getWidgetList, function (req, res, next) {
	  res.render('dashboard-setting-widget', { title: 'Charsabit - Dashboard Setting Widget',
	  	displayName: req.username,
	  	idUser: req.idUser.toString(),
	  	username: req.username,
	  	widgetVisitors: req.visitorList,
	  	widgets: req.widgetList
	   });
	})

	.post(getUser, getVisitorList, getWidgetList, validateURL, generateWidget, getVisitorList, getWidgetList, function (req, res, next) {
		 res.render('dashboard-setting-widget', { title: 'Charsabit - Dashboard Setting Widget',
	  	displayName: req.username,
	  	idUser: req.idUser.toString(),
	  	username: req.username,
	  	widgetVisitors: req.visitorList,
	  	widgets: req.widgetList,
	  	widgetScript: req.widgetScript,
	  	url: req.body.websiteUrl
	   });
	});

// dashboard chat route
router.route('/:username/chat/:idWidget/:vUsername')
	.get(sessionExists, getUser, getVisitorList, getVisitorStatus, function (req, res, next) {
		res.render('dashboard-chat', { title: 'Charsabit - Dashboard Chat',
	  	displayName: req.username,
	  	idDashboard: req.idDashboard.toString(),
	  	idUser: req.idUser.toString(),
	  	username: req.username,
	  	idWidget: req.params.idWidget,
	  	vUsername: req.params.vUsername,
	  	status: req.vStatus,
	  	widgetVisitors: req.visitorList
	  })
	});

// dashboard logout route
router.route('/:username/logout')
	.get(logoutAdministrator, function (req, res, next) {
		res.render('dashboard-logout', { idDashboard: req.idDashboard, idUsername: req.idUsername })
		//res.redirect('/');
	})


module.exports = router;