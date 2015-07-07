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

var DashboardCtrl = require('../controllers/DashboardCtrl');
var WidgetCtrl = require('../controllers/WidgetCtrl');
var AuthCtrl = require('../controllers/AuthCtrl');

/**
 * Globals
 */
var emailAdmin1 = 'admin1@test.com';
var emailAdmin2 = 'admin2@test.com';

var emailVisitor1 = 'visitor1@test.com';
var emailVisitor2 = 'visitor2@test.com';
var emailVisitor3 = 'visitor3@test.com';
var emailVisitor4 = 'visitor4@test.com';

var usernameAdmin1 = 'admin1';
var usernameAdmin2 = 'admin2';

var usernameVisitor1 = 'visitor1';
var usernameVisitor2 = 'visitor2';
var usernameVisitor3 = 'visitor3';
var usernameVisitor4 = 'visitor4';

var password = 'testing123';

var urlTest1 = 'http://test123.test.com';
var urlTest2 = 'http://testabc.test.com';

var dashboardController = new DashboardCtrl(User, Dashboard, Widget, Visitor);
var widgetController = new WidgetCtrl(Dashboard, Widget, Visitor);
var authController = new AuthCtrl(User, Dashboard, Widget, Visitor);

var dbURI     = 'mongodb://localhost:27017/testDB';
var mongoose  = require('mongoose');

/**
 * Unit tests
 */
describe('DashboardCtrl controller Unit Tests:', function() {
	/*before(function (done) {
    mongoose.connect(dbURI, function (err) {
      if (err) {
        throw err;
      }
      done();
    });
	});*/

	/*describe('Method getVisitorList:', function () {
		it('should save empty Widget without error', function (done) {
			Widget.findOne({}, function (err, widget) {
				var widget = new Widget({ });
				widget.save(function (err, widget) {
					should.not.exist(err);
					//done(console.log(widget));
					done();
				});
			});
		});

		it('should save empty Visitor without error', function (done) {
			Visitor.findOne({}, function (err, visitor) {
				var visitor = new Visitor({ });
				visitor.save(function (err, visitor) {
					should.not.exist(err);
					//done(console.log(widget));
					done();
				});
			});
		});

		it('should return empty visitor list []', function (done) {
			authController.registerAdministrator(emailAdmin1, usernameAdmin1, password, function (err, user) {
				dashboardController.getVisitorList(user.idDashboard, function (err, visitorList) {
					should.not.exist(err);
					visitorList.should.have.length(0);
					//done(console.log(visitorList));
					done();
				})
			});
		});

		it('should save widgets without error', function (done) {
			User.findOne({ username: usernameAdmin1 }, function (err, user) {
				widgetController.generateWidget(user.idDashboard, urlTest1, function (err, widget) {
					widgetController.generateWidget(widget.idDashboard, urlTest2, function (err, widget) {
						should.not.exist(err);
						//done(console.log(widget));
						done();
					});
				});
			})
		});

		it('should save visitors without error', function (done) {
			Widget.findOne({ url: urlTest1 }, function (err, widget) {
				authController.registerVisitor(emailVisitor1, usernameVisitor1, password, function (err, visitor) { 
					authController.loginVisitor(widget._id, visitor._id, usernameVisitor1, function (err, visitor1) {

					});	
				});	

				authController.registerVisitor(emailVisitor2, usernameVisitor2, password, function (err, visitor2) { 
					authController.loginVisitor(widget._id, visitor2._id, usernameVisitor2, function (err, visitor3) {
						Widget.findOne({ url: urlTest1 }, function (err, widget1) {
							should.not.exist(err);
							//done(console.log(widget1));
							done();
						});

					});	
				});	
			});		
		});

		it('should return visitor list', function (done) {
			User.findOne({ username: usernameAdmin1 }, function (err, user) {
				dashboardController.getVisitorList(user.idDashboard, function (err, visitorList) {
					should.not.exist(err);
					visitorList.should.have.length(2);
					done(console.log(visitorList));
					//done();
				})
			})
		});

	});

	describe('Method getUser:', function () {
		it('should return user object for administrator user', function (done) {
			dashboardController.getUser(usernameAdmin1, function (err, user) {
				should.not.exist(err);
				user.should.not.empty;
				//done(console.log(user));
				done();
			})
		})
	})
*/
	after(function (done) {
	  Dashboard.remove({}).exec();
	  Widget.remove({}).exec();
	  Visitor.remove({}).exec();
	  User.remove({}).exec();
	  //mongoose.connection.close();
	  done();
	});

});