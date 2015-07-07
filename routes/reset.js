var express = require('express');
var router = express.Router();
var session = require('express-session');
var sess;

var User = require('../models/user');
var Dashboard = require('../models/dashboard');
var Widget = require('../models/widget');
var Visitor = require('../models/visitor');

router.get('/', function (req, res, next) {
	Dashboard.update({ status: 'online' }, { $set: { status: 'offline' } }, { multi: true }).exec();
	Visitor.update({ status: 'online' }, { $set: { status: 'offline' } }, { multi: true }).exec();
	res.redirect('/');
})

module.exports = router;