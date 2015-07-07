var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var User = require('./user');
var Dashboard = require('./dashboard');
var Visitor = require('./visitor');

//define widgetSchema
var WidgetSchema = new Schema({
	idDashboard: {
		type: Schema.Types.ObjectId,
		ref: 'Dashboard'
	},
	url: String,
	widgetCode: String,
	visitors: [{
		type: Schema.Types.ObjectId,
		ref: 'Visitor'
	}]
}, { collection: 'Widgets' });

//compiling widgetSchema into Widget model
var Widget = mongoose.model('Widget', WidgetSchema);

module.exports = Widget;