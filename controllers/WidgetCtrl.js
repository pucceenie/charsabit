var WidgetCtrl = function (userModel, dashboardModel, widgetModel, visitorModel) {
	//this.mongoose = require('mongoose');
	this.passwordHash = require('password-hash');
	this.userModel = userModel;
	this.dashboardModel = dashboardModel;
	this.widgetModel = widgetModel;
	this.visitorModel = visitorModel;
};

// return visitor detail
WidgetCtrl.prototype.getVisitor = function (idWidget, username, callback) {
	var _this = this;
	// find visitor object
	_this.visitorModel.findOne({ 'idWidget': idWidget, 'username': username }, function (err, visitor) {
		if (err) return callback(err);
		// return the visitor status
		return callback(err, visitor);
	})
}

// return dashboard status
WidgetCtrl.prototype.getDashboardStatus = function (idDashboard, callback) {
	var _this = this;
	// find dashboard object
	_this.dashboardModel.findById(idDashboard, function (err, dashboard) {
		if (err) return callback(err);
		// return dashboard status
		return callback(err, dashboard.status);
	})
}

// return widgetDetail
WidgetCtrl.prototype.getWidgetDetail = function (idWidget, callback) {
	var _this = this;
	// find widget object
	_this.widgetModel.findById(idWidget, function (err, widget) {
		return callback(err, widget);
	});
}

module.exports = WidgetCtrl;