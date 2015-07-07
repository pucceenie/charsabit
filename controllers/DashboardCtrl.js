var DashboardCtrl = function (userModel, dashboardModel, widgetModel, visitorModel) {
	this.userModel = userModel;
	this.dashboardModel = dashboardModel;
	this.widgetModel = widgetModel;
	this.visitorModel = visitorModel;

	// privat method _isValidURL, return true if URL is valid
	this._isValidURL = function (url) {
		var re = /^(http?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
		return re.test(url);
	}
}

// get array widget with visitor list detail
DashboardCtrl.prototype.getVisitorList = function (idDashboard, callback) {
	var _this = this;
	// find dashboard object
	_this.dashboardModel.findById(idDashboard, function (err, dashboard) {
		if (err) return callback(err);
		// find widget in widgets
		_this.widgetModel.find({ _id: {$in: dashboard.widgets } }, function (err, visitorList) {
			var result = [];
			// push the visitorList to result (id object to string)
			visitorList.forEach(function (record) {
				var visitors = record.visitors;
				visitors.sort(function (a, b) {
					if (a.username > b.username) {
						return 1;
					}
					if (a.username < b.username) {
						return -1;
					}
					// a must be equal to b
					return 0;
				});
				result.push({ _id: record._id.toString(), url: record.url, visitors: visitors });
			});
			// sorting url
			result.sort(function (a, b) {
				if (a.url > b.url) {
					return 1;
				}
				if (a.url < b.url) {
					return -1;
				}
				// a must be equal to b
				return 0;
			});
			// return the result
			return callback(err, result);
		}).select('_id url visitors').populate({ path: 'visitors', select: 'username status unreadMsg' }).exec();
	})
}

// get array widget detail in Dashboards collection
DashboardCtrl.prototype.getWidgetList = function (idDashboard, callback) {
	var _this = this;
	// find dashboard object
	_this.dashboardModel.findById(idDashboard, function (err, dashboard) {
		// return widgets
		return callback(err, dashboard.widgets);
	}).populate({ path: 'widgets', select: 'url widgetCode -_id' }).exec();
}

// get visitor status
DashboardCtrl.prototype.getVisitorStatus = function (idWidget, username, callback) {
	var _this = this;
	// find visitor object
	_this.visitorModel.findOne({ 'idWidget': idWidget, 'username': username }, function (err, visitor) {
		if (err) return callback(err);
		// return the visitor status
		return callback(err, visitor.status);
	})
}

// input validation for generate widgetcode
DashboardCtrl.prototype.validateInputBeforeGenerate = function (url, callback) {
	var _this = this;
	var errMsg = {};
	// url empty
	if (url === '') {
		errMsg.url = 'Please enter your website URL.';
		// url does not valid
	} else if (!(_this._isValidURL(url))) {
		errMsg.url = 'Please enter a valid URL.';
		// url valid
	} else {
		delete errMsg.url;
	}
	return callback(errMsg);
}

// check URL availibility
DashboardCtrl.prototype.isAvailableURL = function (url, callback) {
	var _this = this;
	var errMsg = {};

	_this.widgetModel.findOne({ 'url': url }, function (err, widget) {
		if (widget) {
			// url already in db
			errMsg.url = 'This website already have Charsabit widget, plese check your widget list.';
		} else {
			// url available
			delete errMsg.url;
		}
		return callback(errMsg);
	})
}

// save widget object to Widgets and save ref to Dashboards
DashboardCtrl.prototype.generateWidget = function (idDashboard, url, callback) {
	var _this = this;
	// create widget object
	var widget = new _this.widgetModel({
		url: url
	});
	// save widget to Widgets collection
	widget.save(function (err, widget) {
		if (err) return callback(err);
		// push widget to widgets in Dashboards collection			
		_this.dashboardModel.findByIdAndUpdate(idDashboard, { $push: { 'widgets': widget._id } }, function (err, dashboard) {
			if (err) {
				return callback(err);
			}
			// generate widgetCode
			var widgetCode = '<!--Start of Charsabit Live Chat Script-->\n<script type=\"text\/javascript\">\nfunction create(htmlStr) {\nvar frag = document.createDocumentFragment(),temp = document.createElement(\'div\');\ntemp.innerHTML = htmlStr;\nwhile (temp.firstChild) {frag.appendChild(temp.firstChild);}\nreturn frag;}\nvar fragment = create(\'<div id=\"charsabit-widget-link\" style=\"position: fixed; bottom: 10px; right: 0\"><a href=\"http:\/\/localhost:3000\/widget\/'+ widget._id +'\" target=\"_blank\"><img src=\"http:\/\/localhost:3000\/data\/chat-widget-ico-hover.png\" height=\"100px\" width=\"100px\" \/><\/a><\/div>\');\ndocument.body.insertBefore(fragment, document.body.childNodes[0]);\n<\/script>\n<!--End of Charsabit Live Chat Script-->';
			// update widget code in widget object
			widget.update({ idDashboard: dashboard._id, widgetCode: widgetCode }, function (err, numAffected) {
				if (err) return callback(err);
				_this.widgetModel.findOne({ url: url }, function (err, widget) {
					return callback(err, widget.widgetCode);
				});
			});
		});
	});	
}

module.exports = DashboardCtrl;