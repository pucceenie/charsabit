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

var AuthCtrl = require('../controllers/AuthCtrl');

//var passwordHash = require('password-hash');

/**
 * Globals
 */
var emailEmpty = '';
var emailValid = 'test@test.com';
var emailValid1 = 'test@test123.com';
// buat contohnya lebih banyak lagi
var emailInvalid = 'test';
var usernameEmpty = '';
var usernameValid = 'testing';
var usernameValid1 = 'testing1';
// buat contohnya lebih banyak lagi
var usernameInvalid = 't e'; 
var passwordEmpty = '';
var passwordValid = 'testing123';
var passwordValid1 = 'testing12345';
// buat contohnya lebih banyak lagi
var passwordInvalid = 't e';

var emailVisitorValid = 'visitor@test123.com';
var visitorValid = 'visitor';

var urlTest = 'http://test123.test.com';

var authController = new AuthCtrl(User, Dashboard, Widget, Visitor);

var dbURI     = 'mongodb://localhost:27017/testDB';
var mongoose  = require('mongoose');

/**
 * Unit tests
 */
describe('AuthCtrl controller Unit Tests:', function() {
	before(function (done) {
    mongoose.connect(dbURI, function (err) {
      if (err) {
        throw err;
      }
      done();
    });
	});

	describe('Method registerAdministrator:', function() {
		it('should be able to save without problems', function (done) {
			User.find({}, function (err, user) {
				if (user.length === 0) {
					authController.registerAdministrator(emailValid, usernameValid, passwordValid, function (err, dashboard) {
						should.not.exist(err);
						//done(console.log(dashboard));	
						done();
					});
				}
			});	
		});
	});

	describe('Method registerVisitor:', function () {
		it('should be able to save without problems', function (done) {
			User.find({ username: 'visitor' }, function (err, user) {	
				if (user.length === 0) {
					authController.registerVisitor(emailVisitorValid, visitorValid, passwordValid, function (err, visitor) {
						should.not.exist(err);
						//done(console.log(visitor));
						done();
					});
				}
			});
		});
	});

	describe('Method validateInputBeforeRegister:', function () {
		it('should return empty error message (for valid input)', function (done) {
			authController.validateInputBeforeRegister(emailValid1, usernameValid1, passwordValid, passwordValid, function (errMsg) {
				errMsg.should.be.empty;
				//done(console.log(errMsg));
				done();
			});
		});

		it('should return error message (for all empty input)', function (done) {
			authController.validateInputBeforeRegister(emailEmpty, usernameEmpty, passwordEmpty, passwordEmpty, function (errMsg) {
				errMsg.email.should.equal('Please enter an email address.');
				errMsg.username.should.equal('Please enter a username.');
				errMsg.password.should.equal('Please enter a password.');
				errMsg.passwordRepeat.should.equal('Please enter your password once more.');
				//done(console.log(errMsg));
				done();
			});
		});

		it('should return error message (for invalid email)', function (done) {
			authController.validateInputBeforeRegister(emailInvalid, usernameValid1, passwordValid, passwordValid, function (errMsg) {
				errMsg.email.should.equal('Please enter a valid email address. (example: user@example.co)');
				errMsg.should.not.have.property('username', 'password', 'passwordRepeat');
				//done(console.log(errMsg));
				done();
			});
		});

		it('should return error message (for invalid username)', function (done) {
			authController.validateInputBeforeRegister(emailValid, usernameInvalid, passwordValid, passwordValid, function (errMsg) {
				errMsg.username.should.equal('Please enter a valid username. (no space, 3-8 characters)');
				errMsg.should.not.have.property('email', 'password', 'passwordRepeat');
				//done(console.log(errMsg));
				done();
			});
		});

		it('should return error message (for invalid password)', function (done) {
			authController.validateInputBeforeRegister(emailValid1, usernameValid1, passwordInvalid, passwordInvalid, function (errMsg) {
				errMsg.password.should.equal('Please enter a valid password. (alfanumeric, > 8 characters)');
				errMsg.should.not.have.property('email', 'username', 'passwordRepeat');
				//done(console.log(errMsg));
				done();
			});
		});

		it('should return error message (for password repeat not match)', function (done) {
			authController.validateInputBeforeRegister(emailValid1, usernameValid1, passwordValid, passwordValid1, function (errMsg) {
				errMsg.passwordRepeat.should.equal('Password doesn\'t match, re-enter your password.');
				errMsg.should.not.have.property('email', 'username', 'password');
				//done(console.log(errMsg));
				done();
			});
		});

	});

	describe('Method isAvailableEmail:', function () {
		it('should return empty error message (for available email)', function (done) {
			authController.isAvailableEmail(emailValid1, function (errMsg) {
				errMsg.should.be.empty;
				//done(console.log(errMsg));
				done();
			});
		});

		it('should return error message (for email already in use)', function (done) {
			authController.isAvailableEmail(emailValid, function (errMsg) {
				errMsg.email.should.equal('Email is not available.');
				//done(console.log(errMsg));
				done();
			});
		});

	});

	describe('Method isAvailableUsername:', function () {
		it('should return empty error message (for available username)', function (done) {
			authController.isAvailableUsername(usernameValid1, function (errMsg) {
				errMsg.should.be.empty;
				//done(console.log(errMsg));
				done();
			});
		});

		it('should return error message (for username already in use)', function (done) {
			authController.isAvailableUsername(usernameValid, function (errMsg) {
				errMsg.username.should.equal('Username is not available.');
				//done(console.log(errMsg));
				done();
			});
		});

	});

	describe('Method validateInputBeforeLogin:', function () {
		it('should return empty error message (for valid input)', function (done) {
			authController.validateInputBeforeLogin(usernameValid, passwordValid, function (errMsg) {
				errMsg.should.empty;
				//done(console.log(errMsg));
				done();
			});
		});

		it('should return error message (for all empty input)', function (done) {
			authController.validateInputBeforeLogin(usernameEmpty, passwordEmpty, function (errMsg) {
				errMsg.username.should.equal('Please enter your username.');
				errMsg.password.should.equal('Please enter your password.');
				//done(console.log(errMsg));
				done();
			});
		});

/*		it('should return error message (for invalid username)', function (done) {
			authController.validateInputBeforeLogin(usernameInvalid, passwordValid, function (errMsg) {
				errMsg.username.should.equal('Please enter a valid username. (no space, 3-8 characters)');
				errMsg.should.not.have.property('password');
				//done(console.log(errMsg));
				done();
			});
		});

		it('should return error message (for invalid password)', function (done) {
			authController.validateInputBeforeLogin(usernameValid, passwordInvalid, function (errMsg) {
				errMsg.password.should.equal('Please enter a valid password. (alfanumeric, > 8 characters)');
				errMsg.should.not.have.property('username');
				//done(console.log(errMsg));
				done();
			});
		});*/
	});

	describe('Method isCorrectUsernamePassword:', function () {
		it('should return empty error message (for available administrator user)', function (done) {
			authController.isCorrectUsernamePassword('administrator', usernameValid, passwordValid, function (errMsg) {
				errMsg.should.be.empty;
				//done(console.log(errMsg));
				done();
			});
		});

		it('should return empty error message (for available visitor user)', function (done) {
			authController.isCorrectUsernamePassword('visitor', visitorValid, passwordValid, function (errMsg) {
				errMsg.should.be.empty;
				//done(console.log(errMsg));
				done();
			});
		});

		it('should return error message (for username not found)', function (done) {
			authController.isCorrectUsernamePassword('administrator', usernameValid1, passwordValid1, function (errMsg) {
				errMsg.username.should.equal('Username not found.');
				errMsg.should.not.have.property('password');
				//done(console.log(errMsg));
				done();
			});
		});

		it('should return error message (for input administrator user to visitor role)', function (done) {
			authController.isCorrectUsernamePassword('visitor', usernameValid, passwordValid, function (errMsg) {
				errMsg.username.should.equal('Wrong user role.');
				errMsg.should.not.have.property('password');
				//done(console.log(errMsg));
				done();
			});
		});

		it('should return error message (for input visitor user to administrator role)', function (done) {
			authController.isCorrectUsernamePassword('administrator', visitorValid, passwordValid, function (errMsg) {
				errMsg.username.should.equal('Wrong user role.');
				errMsg.should.not.have.property('password');
				//done(console.log(errMsg));
				done();
			});
		});

		it('should return error message (for wrong password input)', function (done) {
			authController.isCorrectUsernamePassword('administrator', usernameValid, 'pass123', function (errMsg) {
				errMsg.password.should.equal('Password doesn\'t match.');
				errMsg.should.not.have.property('username');
				//done(console.log(errMsg));
				done();
			});
		});
	});

	describe('Method loginAdministrator:', function () {
		it('should update dashboard [status: online] without error', function (done) {

			User.findOne({ username: usernameValid }, function (err, user) {
				Dashboard.findOne({ idUser: user._id }, function (err, dashboard) {
					authController.loginAdministrator(dashboard._id, function (err, dashboard) {
						should.not.exist(err);
						should.exist(dashboard);
						//done(console.log(dashboard));
						done();
					});
				}).exec();
				
			}).exec();
		});
	});

	describe('Method logoutAdministrator:', function () {
		it('should update dashboard [status: offline] without error', function (done) {
			User.findOne({ username: usernameValid }, function (err, user) {
				Dashboard.findOne({ idUser: user._id }, function (err, dashboard) {
					authController.logoutAdministrator(dashboard._id, function (err, dashboard) {
						should.not.exist(err);
						should.exist(dashboard);
						//done(console.log(dashboard));
						done();
					});
				}).exec();
				
			}).exec();
		});
	});

	describe('Method loginVisitor:', function () {
		it('should save widget without error', function (done) {
			Widget.findOne({}, function (err, widget) {
				if (widget === null) {
					var widget1 = new Widget({
						url: urlTest
					});

					widget1.save(function (err, widget1) {
						should.not.exist(err);
						//done(console.log(widget1));
						done();
					});
				}
			})
		});

		it('should save visitor without error', function (done) {
			Visitor.findOne({}, function (err, visitor) {
				if (visitor === null) {
					var visitor1 = new Visitor({});

					visitor1.save(function (err, visitor1) {
						should.not.exist(err);
						//done(console.log(visitor1));
						done();
					});
				}
			})
		});

		it('should update visitor [status: online] and save into widget.visitors without error', function (done) {
			User.findOne({ username: visitorValid }, function (err, user) {
				Widget.findOne({ url: urlTest }, function (err, widget) {
					authController.loginVisitor(widget._id, user._id, user.username, function (err, visitor) {
						should.not.exist(err);
						done(console.log(visitor));
						//done();
					});
				});
			});
		});
	});

	describe('Method logoutVisitor:', function () {
		it('should update visitor [status: offline] without error', function (done) {
			User.findOne({ username: visitorValid }, function (err, user) {
				Widget.findOne({ url: urlTest }, function (err, widget) {
					authController.logoutVisitor(widget._id, user._id, function (err, visitor) {
						should.not.exist(err);
						//done(console.log(visitor));
						done();
					});
				});
			});
		});
	});

	describe('Method sessionRedirect', function () {
		it('should return link redirect to dashboard for idUsername dashboard', function (done) {
			User.findOne({ username: usernameValid }, function (err, User) {
				var idUsername = User.idDashboard + '_' + usernameValid;
				authController.sessionRedirect(idUsername, function (err, redirect) {
					redirect.should.be.equal('/dashboard/testing');
					//done(console.log(redirect));
					done();
				})
			})
		})

		it('should return link redirect to widget for idUsername widget', function (done) {
			var idUsername = '55839c7794eb4ee41a4b66a1_' + visitorValid;
			authController.sessionRedirect(idUsername, function (err, redirect) {
				redirect.should.be.equal('/widget/55839c7794eb4ee41a4b66a1');
				//done(console.log(redirect));
				done();
			})
		})
	})

	/*describe('Populate testing:', function () {
		it('test populate user with dashboard', function (done) {
			User.findOne({ username: usernameValid }, function (err, user) {
				done(console.log(user));
			}).populate('idDashboard').exec();
		});

		it('test populate dashboard with user', function (done) {
			Dashboard.findOne({ status: 'offline' }, function (err, dashboard) {
				done(console.log(dashboard));
			}).populate('idUser').exec();
		});

		it('test populate widget with visitor', function (done) {
			Widget.findOne({ url: urlTest }, function (err, widget) {
				done(console.log(widget));
			}).populate('visitors').exec();
		});

		it('test populate visitor with widget', function (done) {
			Visitor.findOne({ username: visitorValid }, function (err, visitor) {
				done(console.log(visitor));
			}).populate('idWidget').exec();
		});
	});*/
	
	after(function (done) {
	  User.remove({}).exec();
	  Dashboard.remove({}).exec();
	  Widget.remove({}).exec();
	  Visitor.remove({}).exec();
	  //mongoose.connection.close();
	  done();
	});

});