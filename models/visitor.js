var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('./user');
var Widget = require('./widget');

var visitorSchema = new Schema({
	idUser: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	},
	username: String,
	idWidget: {
		type: Schema.Types.ObjectId,
		ref: 'Widget'
	},
	status: String,
	unreadMsg: [{
		type: Schema.Types.ObjectId,
		ref: 'Visitor'
	}],
	unreadWidgetMsg: [{
		type: Schema.Types.ObjectId,
		ref: 'Visitor'
	}],
	idUsernameAdministrator: String
}, { collection: 'Visitors' });

var Visitor = mongoose.model('Visitor', visitorSchema);

module.exports = Visitor;