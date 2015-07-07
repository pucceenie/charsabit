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

//-------------------------------GET middlewares---------------------------------------
function sessionExists (req, res, next) {
	sess = req.session;

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
/* GET home page. */
router.get('/', sessionExists, function(req, res, next) {
  res.render('index', { title: 'Charsabit', carousel: [
  		{imgpath: "/images/carousel/02.png", caption: "Pesan terenkripsi dan dikirimkan melalui internet", slide: 1},
			{imgpath: "/images/carousel/03.png", caption: "Admin menerima pesan yang sudah terenkripsi dari Sigit (Visitor)", slide: 2},
			{imgpath: "/images/carousel/04.png", caption: "Admin menulis pesan kepada Efendi (Visitor), kemudian menekan \"enter\"", slide: 3},
			{imgpath: "/images/carousel/05.png", caption: "Pesan terenkripsi dan dikirimkan melalui internet", slide: 4},
			{imgpath: "/images/carousel/06.png", caption: "Efendi (Visitor) menerima pesan yang sudah terdekripsi dari Admin", slide: 5},
			{imgpath: "/images/carousel/07.png", caption: "Seorang Intruder mencoba mengintip isi pesan, yang didapat adalah pesan terenkripsi", slide: 6}
  	] });
});

module.exports = router;
