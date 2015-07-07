var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Dashboard = require('./dashboard');
//var Widget = require('./widget');
//var Visitor = require('./visitor');

//define userSchema
var userSchema = new Schema({
	email: String,
	username: String,
	passwordHash: String,
	role: String,
	idDashboard: {
		type: Schema.Types.ObjectId,
		ref: 'Dashboard'
	}
	/*idVisitors: [{
		type: Schema.Types.ObjectId,
		ref: 'Dashboard'
	}]*/
	/*widgets: [{
		type: Schema.Types.ObjectId,
		ref: 'Widget'
	}]*/
}, { collection: 'Users' });

/*userSchema.statics.getUserByDataField = function (field, data, callback) {
	var _this = this;

	var query = {};
	query[field] = data;

	_this.findOne(query, function (err, user) {
		if (err) {
			return callback(err);
		}
		if (user) {
			return callback(err, user);
		} else {
			return callback(err, null);
		}
	});
}*/

//compiling userSchema into User model
var User = mongoose.model('User', userSchema);

module.exports = User;