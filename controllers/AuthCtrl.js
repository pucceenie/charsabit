var AuthCtrl = function (userModel, dashboardModel, widgetModel, visitorModel) {
	this.passwordHash = require('password-hash');
	this.userModel = userModel;
	this.dashboardModel = dashboardModel;
	this.widgetModel = widgetModel;
	this.visitorModel = visitorModel;

	// privat method _isValidEmailAddress, return true if email is valid
	this._isValidEmailAddress = function (email) {
		var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
		return re.test(email);
	};

	// privat method _isValidUsername, return true if username is valid
	this._isValidUsername = function (username) {
		var re = /^[a-z0-9_-]{3,8}$/;
		return re.test(username);
	}

	// privat method _isValidPassword, return true if password is valid
	this._isValidPassword = function (password) {
		var re = /^(?=.*\d)[0-9a-zA-Z]{8,}$/;
		return re.test(password);
	}
};

// ----- public method -------

// return user object if username has role administrator
AuthCtrl.prototype.getAdministrator = function (username, callback) {
	var _this = this;

	_this.userModel.findOne({ username: username, role: 'administrator' }, function (err, user) {
		if (err) return callback(err);
		return callback(err, user);
	})
}

// return user object if username has role visitor
AuthCtrl.prototype.getVisitor = function (username, callback) {
	var _this = this;

	_this.userModel.findOne({ username: username, role: 'visitor' }, function (err, user) {
		if (err) return callback(err);
		return callback(err, user);
	})
}

// ----- signup method -------

// input validation for signup
AuthCtrl.prototype.validateInputBeforeRegister = function (email, username, password, passwordRepeat, callback) {
	var _this = this;
	var errMsg = {};
	// empty email
	if (email === '') {
		errMsg.email = 'Please enter an email address.';
		// email does not valid
	} else if (!(_this._isValidEmailAddress(email))) {
		errMsg.email = 'Please enter a valid email address. (example: user@example.com)';
	} else {
		// email valid
		delete errMsg.email;
	}
	// empty username
	if (username === '') {
		errMsg.username = 'Please enter a username.';
		// username does not valid
	} else if (!(_this._isValidUsername(username))) {
		errMsg.username = 'Please enter a valid username. (no space, 3-8 characters)';
	} else {
		// username valid
		delete errMsg.username;
	}
	// password empty
	if (password === '') {
		errMsg.password = 'Please enter a password.';
		// password does not valid
	} else if (!(_this._isValidPassword(password))) {
		errMsg.password = 'Please enter a valid password. (alfanumeric, > 8 characters)';
	} else {
		// password valid
		delete errMsg.password;
	}
	// repeat password empty
	if (passwordRepeat === '') {
		errMsg.passwordRepeat = 'Please enter your password once more.';
		// repeat password does not match with password
	} else if (passwordRepeat !== password) {
		errMsg.passwordRepeat = 'Password doesn\'t match, re-enter your password.';
	} else {
		// repeat password match
		delete errMsg.passwordRepeat;
	}

	return callback(errMsg);
};

// check email availibility
AuthCtrl.prototype.isAvailableEmail = function (email, callback) {
	var _this = this;
	var errMsg = {};

	_this.userModel.findOne({ 'email': email }, function (err, user) {
		if (err) {
			delete errMsg.email;
			// email already in db
		} else if (user) {
			errMsg.email = 'Email is not available.';
		} else {
			// email available
			delete errMsg.email;
		}
		return callback(errMsg);
	});
};

// check username availablility
AuthCtrl.prototype.isAvailableUsername = function (username, callback) {
	var _this = this;
	var errMsg = {};

	_this.userModel.findOne({ 'username': username }, function (err, user) {
		if (err) {
			delete errMsg.username;
			// username already in db
		} else if (user) {
			errMsg.username = 'Username is not available.';
		} else {
			// username available
			delete errMsg.username;
		}
		return callback(errMsg);
	});
};

// save user object to Users collection (role administrator), and dashboard object to Dashboard collection
AuthCtrl.prototype.registerAdministrator = function (email, username, password, callback) {
	var _this = this;
	// create user object
	var administrator = new _this.userModel({
		username: username,
		passwordHash: _this.passwordHash.generate(password),
		email: email,
		role: 'administrator'
	});
	// save user object to Users collection
	administrator.save(function (err, administrator) {
		if (err) return callback(err);
		// create dashboard object with ref id user
		var dashboard = new _this.dashboardModel({
			idUser: administrator._id,
			widgets: []
		});
		//save dashboard object to Dashboards collection
		dashboard.save(function (err, dashboard) {
			administrator.update({ idDashboard: dashboard._id }, function (err, numAffected) {
				return callback(err, numAffected);
			});	
		});
	});
};

// save user object to Users collection (role visitor)
AuthCtrl.prototype.registerVisitor = function (email, username, password, callback) {
	var _this = this;
	// create user object
	var visitor = new _this.userModel({
		username: username,
		passwordHash: _this.passwordHash.generate(password),
		email: email,
		role: 'visitor'
	});
	// save user object to Users collection
	visitor.save(function (err, visitor) {
		if (err) return callback(err);
		return callback(err, visitor);
	});
};

// ----- login method -------

// input validation for login
AuthCtrl.prototype.validateInputBeforeLogin = function (username, password, callback) {
	var _this = this;
	var errMsg = {};
	// username empty
	if (username === '') {
		errMsg.username = 'Please enter your username.';
	} else {
		delete errMsg.username;
	}
	// password empty
	if (password === '') {
		errMsg.password = 'Please enter your password.';
	} else {
		delete errMsg.password;
	}

	return callback(errMsg);
};

// check username availability, role, and password match
AuthCtrl.prototype.isCorrectUsernamePassword = function (role, username, password, callback) {
	var _this = this;
	var errMsg = {};

	_this.userModel.findOne({ 'username': username }, function (err, user) {
		if (err) {
			delete errMsg.username;
		} else if (user) {
			// role administrator
			if (user.role === 'administrator') {
				if (role === 'administrator') {
					delete errMsg.username;
				} else {
					errMsg.username = 'Wrong user role.';
				}
			// role visitor
			} else {
				if (role === 'administrator') {
					errMsg.username = 'Wrong user role.';
				} else {
					delete errMsg.username;
				}
			}
			// password empty
			if (password === '') {
				errMsg.password = 'Please enter your password.';
				// password hash match
			} else if (_this.passwordHash.verify(password, user.passwordHash)) {
				delete errMsg.password;
				// password doesn't match
			} else {
				errMsg.password = 'Password doesn\'t match.';
			}
			// username not found in db
		} else {
			errMsg.username = 'Username not found.';
		}
		return callback(errMsg);
	});
};


// set status dashboard object to :online
AuthCtrl.prototype.loginAdministrator = function (username, callback) {
	var _this = this;
	var data = {
		success: false
	}

	_this.getAdministrator(username, function (err, user) {
		_this.dashboardModel.findById(user.idDashboard, function (err, dashboard) {
			// user already online in other device or browser
			if (dashboard.status === 'online') {
				return callback(err, data);
			} else {
				// set data value
				data.success = true;
				data.idDashboard = dashboard._id;
				data.idUsername = dashboard._id + '_' + username;
				// update dashboard status to online
				_this.dashboardModel.findByIdAndUpdate(data.idDashboard, { $set: { 'status': 'online' } }, { upsert: true }, function (err, dashboard) {
					if (err) return callback(err);
					return callback(err, data);
				});
			}
		})
	})
}

// set status user in widget object to :online
AuthCtrl.prototype.loginVisitor = function (idWidget, username, callback) {
	var _this = this;
	var data = {
		success: false
	}

	_this.visitorModel.findOne({ username: username, idWidget: idWidget }, function (err, visitor) {
		if (err) return callback(err);
		if (visitor) {
			// user already online in other device or browser
			if (visitor.status === 'online') {
				return callback(err, data);
			} else {
				// set data value
				data.success = true;
				data.idDashboard = visitor.idUsernameAdministrator.split('_')[0];
				data.idUsername = visitor.idWidget + '_' + visitor.username;
				data.idWidget = visitor.idWidget;
				// update visitor status to online
				_this.visitorModel.findByIdAndUpdate( visitor._id, { $set: { 'status': 'online' } }, function (err, visitor) {
					if (err) return callback(err);
					return callback(err, data);
				});
			}
		} else {
			_this.getVisitor(username, function (err, user) {
				// create visitor object
				var visitor = new _this.visitorModel({
					idUser: user._id,
					status: 'online',
					username: username,
					unreadMsg: [],
					unreadWidgetMsg: []
				});
				// save visitor object to Visitors collection
				visitor.save(function (err, visitor) {
					if (err) return callback(err);
					// add visitor object id to visitors array in Widgets collection
					_this.widgetModel.findByIdAndUpdate(idWidget, { $push: { 'visitors': visitor._id } }, function (err, widget) {
						if (err) {
							return callback(err);
						}
						// get id dashboard and administrator username from Users collection
						_this.userModel.findOne({ idDashboard: widget.idDashboard }, function (err, user) {
							// set idUsernameAdministrator value
							var idUsernameAdministrator = widget.idDashboard + '_' + user.username;
							// update idUsernameAdministrator
							visitor.update({ idWidget: widget._id, idUsernameAdministrator: idUsernameAdministrator }, function (err, numAffected) {
								// set data value
								data.success = true;
								data.idDashboard = widget.idDashboard;
								data.idUsername = idWidget + '_' + username;
								data.idWidget = idWidget;
								return callback(err, data);
							});
						})
					});
				});
			});
		}
	})
}

// ----- logout method -------
				
// set status dashboard object to :offline
AuthCtrl.prototype.logoutAdministrator = function (idDashboard, callback) {
	var _this = this;
	// set dashboard status to offline
	_this.dashboardModel.findByIdAndUpdate(idDashboard, { $set: { 'status': 'offline' } }, function (err, dashboard) {
		if (err) return callback(err);
		_this.dashboardModel.findById(idDashboard, function (err, dashboard) {
			return callback(err, dashboard);
		});
	});
}

// set status user in visitor object to :offline
AuthCtrl.prototype.logoutVisitor = function (idWidget, username, callback) {
	var _this = this;
	// set visitor status to offline
	_this.visitorModel.findOneAndUpdate(
		{ 'idWidget': idWidget, 'username': username }, 
		{ 
			$set: { 'status': 'offline' } 
		}, 
		function (err, visitor) {
			if (err) {
				return callback(err);
			}
			if (visitor) {
				_this.visitorModel.findById(visitor._id, function (err, visitor) {
					return callback(err, visitor);
				})
			}
		}
	)
}

// ----- session redirect method -------

// return redirect url base on session idUsername
AuthCtrl.prototype.sessionRedirect = function (idUsername, callback) {
	var _this = this;

	var split = idUsername.split('_');
	var id = split[0];
	var username = split[1];

	var redirect = '';

	_this.dashboardModel.findById(id, function (err, dashboard) {
		if (err) return callback(err);
		// redirect to dashboard
		if (dashboard) {
			redirect = '/dashboard/' + username;
		} else {
			// redirect to widget
			redirect = '/widget/' + id + '/chat/' + username;
		}
		return callback(err, redirect);
	})
}

module.exports = AuthCtrl;