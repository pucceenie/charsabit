var express = require('express');
var router = express.Router();
var FileCtrl = require('../controllers/FileCtrl');

var Dashboard = require('../models/dashboard');
var Message = require('../models/message');
var User = require('../models/user');
var Visitor = require('../models/visitor');
var Widget = require('../models/widget');

router.get('/', function (req, res) {
	fileController = new FileCtrl();
	
	/*fileController.writeFile('./public/images/ava-admin.png', 'ava-admin.png', function (file) {
		console.log(file.filename + ' written to DB');
	});

	fileController.writeFile('./public/images/ava-visitor.png', 'ava-visitor.png', function (file) {
		console.log(file.filename + ' written to DB');
	});	

	fileController.writeFile('./public/images/admin-offline.png', 'admin-offline.png', function (file) {
		console.log(file.filename + ' written to DB');
	});

	fileController.writeFile('./public/images/other-browser.png', 'other-browser.png', function (file) {
		console.log(file.filename + ' written to DB');
	});

	fileController.writeFile('./public/images/chat-widget-ico.png', 'chat-widget-ico.png', function (file) {
		console.log(file.filename + ' written to DB');
	});*/

	fileController.fileExists('chat-widget-ico-hover.png', function (found) {
		if (!(found)) {
			fileController.writeFile('./public/images/chat-widget-ico-hover.png', 'chat-widget-ico-hover.png', function (file) {
				console.log(file.filename + ' written to DB');
			});
		}
	});

	Dashboard.findOne({}, function (err, dashboard) {
		if (dashboard === null) {
			var dashboard1 = new Dashboard({ });

			dashboard1.save(function (err, dashboard1) { });
		}
	});

	Message.findOne({}, function (err, message) {
		if (message === null) {
			var message1 = new Message({ });

			message1.save(function (err, message1) { });
		}
	});

	User.findOne({}, function (err, user) {
		if (user === null) {
			var user1 = new User({ });

			user1.save(function (err, user1) { });
		}
	});

	Visitor.findOne({}, function (err, visitor) {
		if (visitor === null) {
			var visitor1 = new Visitor({ });

			visitor1.save(function (err, visitor1) { });
		}
	})

	Widget.findOne({}, function (err, widget) {
		if (widget === null) {
			var widget1 = new Widget({ });

			widget1.save(function (err, widget1) { });
		}
	});
	

	//res.send('ava-admin.png, ava-visitor.png, chat-widget-ico.png, chat-widget-ico-hover.png, admin-offline.png, other-browser.png has been created.');
	res.send('chat-widget-ico-hover.png has been created.');
});

router.get('/:imgtag', function (req, res, next) {
	fileController = new FileCtrl();
	fileController.fileExists(req.params.imgtag, function (bool) {
		if (bool) {
			fileController.readFile(req.params.imgtag, function (data) {
				res.type('png');
				data.pipe(res);
			});
		} else {
			var err = new Error('Not Found');
		  err.status = 404;
		  next(err);
		}
	})
});


//kalo mau hapus
/*router.get('/', function (req, res) {
	fileController = new FileCtrl();
	fileController.deleteFile('ava-visitor.png');
	fileController.deleteFile('ava-admin.png');

	res.end();
});*/

module.exports = router;