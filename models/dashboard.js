var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('./user');
var Widget = require('./widget');

//define dashboardSchema
var dashboardSchema = new Schema({
	idUser: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	},
	widgets: [{
		type: Schema.Types.ObjectId,
		ref: 'Widget'
	}],
	status: String
}, { collection: 'Dashboards' });

//compiling dashboardSchema into Dashboard model
var Dashboard = mongoose.model('Dashboard', dashboardSchema);

module.exports = Dashboard;