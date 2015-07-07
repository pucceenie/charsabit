var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//define messageSchema
var messageSchema = new Schema({
		message: String,
		sender: String,
		receiver: String,
		timeSent: { 
			type: Date, 
			default: Date.now 
		},
		timeReceive: Date
	}, { collection: 'Messages' });

//compiling messageSchema into Message model
var Message = mongoose.model('Message', messageSchema);

module.exports = Message;