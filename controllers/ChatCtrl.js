var ChatCtrl = function (messageModel, visitorModel) {
	this.messageModel = messageModel;
	this.visitorModel = visitorModel;
	this.Rabbit = require('./rabbit');
	this.RSA = require('./RSA');
}

// ---------- kriptografi --------------------
// method for encrypt or decrypt message
ChatCtrl.prototype.crypt = function (msg, keyIV) {
	var _this = this;
	var rabbit = new _this.Rabbit();
	rabbit.setKeyIV(keyIV);
	rabbit.setupKey(rabbit.getKey());
	rabbit.setupIV(rabbit.getIV());
	var crypt = rabbit.crypt(msg);
	return crypt;
}

// method encrypt keyIV using RSA
ChatCtrl.prototype.encryptKeyIV = function (keyIV, pubKey) {
	var _this = this;

	var RSA = new _this.RSA();
	RSA.setKunciPublik(pubKey.n, pubKey.e);
	var secretKeyIV = RSA.enkripsi(keyIV, RSA.getKunciPublik());

	return secretKeyIV;
}

// method decrypt keyIV using RSA
ChatCtrl.prototype.decryptKeyIV = function (secretKeyIV, n, e, d) {
	var _this = this;
	var RSA = new _this.RSA();
	RSA.setKunciPublik(n, e);
	RSA.setKunciPrivat(d);
	var keyIV = RSA.dekripsi(secretKeyIV, RSA.getKunciPrivat(), RSA.getKunciPublik());
	if (keyIV.length < 48) {
		for (var i = keyIV.length; i < 48; i++) {
			keyIV = '0' + keyIV;
		}
	}
	return keyIV;
}

// ---------- CRUD Messages and Visitors collection ------------------
// save msg object from dashboard to Messages collection
// sender: idUsername
// receiver: idVUsername
ChatCtrl.prototype.saveMsg = function (msg, sender, receiver, role, callback) {
	var _this = this;
	// create message object
	var message = new _this.messageModel({
		message: msg,
		sender: sender,
		receiver: receiver
	});
	// save message object to Messages collection
	message.save(function (err) {
		if (err) return callback(err);
		// add message object id to unreadWidgetMsg array in Visitors collection
		if (role === 'administrator') {
			var split = receiver.split('_');
			var id = split[0];
			var username = split[1];
			_this.visitorModel.findOneAndUpdate({ idWidget: id, username: username }, { $push: { 'unreadWidgetMsg': message._id } }, function (err, visitor) {
				if (err) return callback(err);
				_this.messageModel.findById(message._id, function (err, msg) {
					if (err) return callback(err);
					return callback(err, msg);
				});
			});
		} else {
			var split = sender.split('_');
			var id = split[0];
			var username = split[1];
			_this.visitorModel.findOneAndUpdate({ idWidget: id, username: username }, { $push: { 'unreadMsg': message._id } }, function (err, visitor) {
				if (err) return callback(err);
				_this.messageModel.findById(message._id, function (err, msg) {
					if (err) return callback(err);
					return callback(err, msg);
				});
			});
		}	
	});
}

// get msg
ChatCtrl.prototype.getMsg = function (sender, receiver, keyIV, callback) {
	var _this = this;
	_this.getUnreadMsg(sender, receiver, function (err, arrId) {
		_this.messageModel.find({ _id: { $in: arrId } }, function (err, msg) {
			if (err) return callback(err);
			var result = [];
			msg.forEach(function (record) {
				var message = record.message;
				var cryptMsg = _this.crypt(message, keyIV);
				result.push({ idMsg: record._id, sender: record.sender, receiver: record.receiver, msg: cryptMsg, timeStamp: record.timeSent });
			});
			return callback(err, result);
		})
	})
	
}

// kalo getunread admin, sendernya tuh visitor, versi versa
ChatCtrl.prototype.getUnreadMsg = function (sender, receiver, callback) {
	var _this = this;
	// find msg object that time receive is null, sender: sender, receiver: receiver
	// return array id object msg
	_this.messageModel.find({ $and: [ { sender: sender }, { receiver: receiver }, { timeReceive: null } ] }, '_id' , function (err, arrId) {
		if (err) return callback(err);
		return callback(err, arrId);
	});
}

// read msg, update time receiver and delete unreadMsg/unreadWidgetMsg array element
ChatCtrl.prototype.readMsg = function (sender, receiver, role, callback) {
	var _this = this;
	// role administrator, delete unreadMsg array element in Visitors collection
	if (role === 'administrator') {
		var split = sender.split('_');
		var id = split[0];
		var username = split[1];
		// find visitor object
		_this.visitorModel.findOne({ idWidget: id, username: username }, function (err, visitor) {
			if (err) return callback(err);
			// update msg model
			_this.messageModel.update( { _id: { $in: visitor.unreadMsg } }, { $set: { timeReceive: new Date() } }, { multi: true }, function (err, numAffected) {
				if (err) return callback(err);
				// update unreadMsg to empty array
				_this.visitorModel.findByIdAndUpdate(visitor._id, { $set: { unreadMsg: [] } }, function (err, numAffected) {
					if (err) return callback(err);
					return callback(err, numAffected);
				})
			})
		});		
	} else {
		// role visitor, delete unreadWidgetMsg array element in Visitors collection
		var split = receiver.split('_');
		var id = split[0];
		var username = split[1];
		// find visitor object
		_this.visitorModel.findOne({ idWidget: id, username: username }, function (err, visitor) {
			if (err) return callback(err);
			// update msg model
			_this.messageModel.update( { _id: { $in: visitor.unreadWidgetMsg } }, { $set: { timeReceive: new Date() } }, { multi: true }, function (err, numAffected) {
				if (err) return callback(err);
				// update unreadMsg to empty array
				_this.visitorModel.findByIdAndUpdate(visitor._id, { $set: { unreadWidgetMsg: [] } }, function (err, numAffected) {
					if (err) return callback(err);
					return callback(err, numAffected);
				})
			})
		});
	}
}

// get latest 10 msg
/*ChatCtrl.prototype.getLast10Msg = function (idUsername, idVUsername, callback) {
	_this = this;

	_this.messageModel.find({ $or: [{ $and: [ { sender: idUsername }, { receiver: idVUsername } ] }, 
																	{ $and: [ { sender: idVUsername }, { receiver: idUsername } ] } 
																] },  function (err, arrId) {
		if (err) return callback(err);
		return callback(err, arrId);
	}).sort({ 'timeSent': -1 }).limit(10);
}*/


module.exports = ChatCtrl;