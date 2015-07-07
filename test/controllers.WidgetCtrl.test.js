'use strict';

/**
 * Module dependencies.
 */

var should = require('should');
var mongoose = require('mongoose');
var Widget = require('../models/widget');
var User = require('../models/user');
var Dashboard = require('../models/dashboard');
var Visitor = require('../models/visitor');

var WidgetCtrl = require('../controllers/WidgetCtrl');

/**
 * Globals
 */
var urlEmpty = '';
var urlValid = 'http://test.com';
var urlValid1 = 'http://test123.com';
var urlInvalid = 'testabc';

var widgetController = new WidgetCtrl(User, Dashboard, Widget, Visitor);

var dbURI     = 'mongodb://localhost:27017/testDB';
var mongoose  = require('mongoose');

/**
 * Unit tests
 */
describe('WidgetCtrl controller Unit Tests:', function() {
	/*before(function (done) {
    mongoose.connect(dbURI, function (err) {
      if (err) {
        throw err;
      }
      done();
    });
	});
*/
	describe('Method generateWidget:', function () {
		it('should save dashboard without error', function (done) {
			Dashboard.findOne({}, function (err, dashboard) {
				if (dashboard === null) {
					var dashboard1 = new Dashboard({
						status: 'online'
					});

					dashboard1.save(function (err, dashboard1) {
						should.not.exist(err);
						//done(console.log(dashboard1));
						done();
					});
				}
			})
		});

		it('should be able to save without problems', function (done) {
			Widget.find({}, function (err, widget) {
				if (widget.length === 0) {
					Dashboard.findOne({ status: 'online' }, function (err, dashboard) {
						widgetController.generateWidget(dashboard._id, urlValid, function (err, widget) {
							should.not.exist(err);
							//done(console.log(widget));
							done();
						});
					})
				}
			});	
		});
	});

	describe('Method validateInputBeforeGenerate:', function () {
		it('should return empty error message (for valid input)', function (done) {
			widgetController.validateInputBeforeGenerate(urlValid1, function (errMsg) {
				errMsg.should.be.empty;
				//done(console.log(errMsg));
				done();
			});
		});

		it('should return error message (for empty input)', function (done) {
			widgetController.validateInputBeforeGenerate(urlEmpty, function (errMsg) {
				errMsg.url.should.equal('Please enter your website URL.');
				//done(console.log(errMsg));
				done();
			});
		});

		it('should return error message (for invalidURL)', function (done) {
			widgetController.validateInputBeforeGenerate(urlInvalid, function (errMsg) {
				errMsg.url.should.equal('Please enter a valid URL.');
				//done(console.log(errMsg));
				done();
			});
		});
	});

	describe('Method isAvailableURL:', function () {
		it('should return empty error message (for available URL)', function (done) {
			widgetController.isAvailableURL(urlValid1, function (errMsg) {
				errMsg.should.be.empty;
				//done(console.log(errMsg));
				done();
			});
		});

		it('should return empty error message (for URL already in use)', function (done) {
			widgetController.isAvailableURL(urlValid, function (errMsg) {
				errMsg.url.should.equal('This website already have Charsabit widget, plese check your widget list.');
				//done(console.log(errMsg));
				done();
			});
		});
	});

	describe('Method getWidgetList:', function () {
		it('should be able to save without problems', function (done) {
			Widget.find({}, function (err, widget) {
				if (widget.length === 1) {
					Dashboard.findOne({ status: 'online' }, function (err, dashboard) {
						widgetController.generateWidget(dashboard._id, urlValid1, function (err, widget) {
							should.not.exist(err);
							//done(console.log(widget));
							done();
						});
					})
				}
			});	
		});

		it('should return detailed array widget without error', function (done) {
			Dashboard.findOne({ status: 'online' }, function (err, dashboard) {
				widgetController.getWidgetList(dashboard._id, function (err, widgets) {
					should.not.exist(err);
					//done(console.log(widgets));
					done();
				});
			})
		})
	})

	/*describe('Populating testing:', function () {
		it('test populate dashboard with widget', function (done) {
			Dashboard.findOne({ status: 'online' }, function (err, dashboard) {
				done(console.log(dashboard));
			}).populate('widgets').exec();
		});

		it('test populate widget with dashboard', function (done) {
			Widget.findOne({ url: urlValid }, function (err, widget) {
				done(console.log(widget));
			}).populate('idDashboard').exec();
		});
	})*/
	
	after(function (done) {
	  Dashboard.remove({}).exec();
	  Widget.remove({}).exec();
	  Visitor.remove({}).exec();
	  mongoose.connection.close();
	  done();
	});

});