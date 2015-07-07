// message controller, control the message flow, how to save to local storage, how to display to message inner, and error msg handler
var CryptMsgCtrl = function () {
	// msgBox component
	this.msgBox = [];

	// private variable, add stylesheet
	var _invalidInputStyle = 'has-error';
	var _invisibleStyle = 'alert-invisible';
	var _visibleStyle = 'alert-visible';

	// boolean is valid input
	this.isValidInput = true;

	// private method to hide the alert
	this._hideAlert = function () {
		this.msgBox[1].removeClass(_visibleStyle).addClass(_invisibleStyle);
		this.msgBox[2].removeClass(_invalidInputStyle);
	}

	// private method to show the alert
	this._showAlert = function (txtAlert) {
		this.msgBox[1].html(txtAlert);
		this.msgBox[1].removeClass(_invisibleStyle).addClass(_visibleStyle).slideDown();
		this.msgBox[2].addClass(_invalidInputStyle);
	}

	// private method to change date format
	this._formatDate = function (date) {
		var dateNow = new Date();
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var ampm = hours >= 12 ? 'pm' : 'am';
		hours = hours % 12;
		hours = hours ? hours : 12;
		minutes = minutes < 10 ? '0'+minutes : minutes;
		var strTime = hours + ':' + minutes + ampm;
		if (date.toDateString() === dateNow.toDateString()) {
			return strTime;
		} else {
			return date.getDate() + '/' + (date.getMonth() + 1) + ' ' + strTime;
		}
	}

}

// ------------ kripto --------------
// remove key and message after logout or session does not exists
CryptMsgCtrl.prototype.removeKeyAndMessage = function () {
	localStorage.removeItem('client_keyIV');
	localStorage.removeItem('server_keyIV');
	localStorage.removeItem('server_kunciPublik_e');
	localStorage.removeItem('server_kunciPublik_n');
	// remove message
	Object.keys(localStorage)
		.forEach(function (key) {
			if (/^messages_/.test(key)) {
				localStorage.removeItem(key);
			}
		});
}

// check client keyiv availability in local storage
CryptMsgCtrl.prototype.isAvailableKeyIV = function () {
	if (localStorage['client_keyIV']) {
		return true;
	} else {
		return false;
	}
}

// check client rsa key availability in local storage
CryptMsgCtrl.prototype.isAvailableRSAKey = function () {
	if (localStorage['client_kunciPublik_n'] && localStorage['client_kunciPublik_e'] && localStorage['client_kunciPrivat_d']) {
		return true;
	} else {
		return false;
	}
}

// generate rsa key and save to local storage
CryptMsgCtrl.prototype.generateAndSaveRSAKey = function () {
	rsa = new RSA();
	rsa.pembangkitKunci(192);
	localStorage['client_kunciPublik_n'] = rsa.kunci.kunciPublik.getN();
	localStorage['client_kunciPublik_e'] = rsa.kunci.kunciPublik.getE();
	localStorage['client_kunciPrivat_d'] = rsa.kunci.kunciPrivat.getD();
}

// generate keyiv and save to local storage
CryptMsgCtrl.prototype.generateAndSaveKeyIV = function () {
	rabbit = new Rabbit();
	var keyIV = rabbit.createKeyIV();
	localStorage['client_keyIV'] = keyIV;
}

// get client pubkey from local storage, return
// pubkey = {
// 		n: 14371343929626017999139431136838112768087843761251991417949,
//		e: 5471737747308237468435381722180996820505264772202975279371
// }
CryptMsgCtrl.prototype.getClientPubKey = function () {
	var pubKey = {};
	pubKey.n = localStorage['client_kunciPublik_n'];
	pubKey.e = localStorage['client_kunciPublik_e'];
	return pubKey;
}

// get client pvtkey from local storage, return
// 1659753657407600073244968390781770611643473805307669044131
CryptMsgCtrl.prototype.getClientPvtKey = function () {
	return localStorage['client_kunciPrivat_d'];
}

// get client keyiv from local storage, return
// 207a5181f3496b208a94ec839dc98228d7f94c9dc0135daf
CryptMsgCtrl.prototype.getClientKeyIV = function () {
	return localStorage['client_keyIV'];
}

// save server pubkey to local storage
CryptMsgCtrl.prototype.saveServerPubKey = function (n, e) {
	localStorage['server_kunciPublik_n'] = n;
	localStorage['server_kunciPublik_e'] = e;
}

// get server pubkey from local storage, return 
// pubkey = {
// 		n: 14371343929626017999139431136838112768087843761251991417949,
//		e: 5471737747308237468435381722180996820505264772202975279371
// }
CryptMsgCtrl.prototype.getServerPubKey = function () {
	var pubKey = {};
	pubKey.n = localStorage['server_kunciPublik_n'];
	pubKey.e = localStorage['server_kunciPublik_e'];
	return pubKey;
}

// save server keyiv to local storage
CryptMsgCtrl.prototype.saveServerKeyIV = function (keyIV) {
	localStorage['server_keyIV'] = keyIV;
}

// get server keyiv from local storage, return
// 207a5181f3496b208a94ec839dc98228d7f94c9dc0135daf
CryptMsgCtrl.prototype.getServerKeyIV = function () {
	return localStorage['server_keyIV'];
}

// encrypt keyiv with server pubkey, return secret keyiv
CryptMsgCtrl.prototype.encryptKeyIV = function () {
	var rsa = new RSA();
	var keyIV = this.getClientKeyIV();
	var pubKey = this.getServerPubKey();
	rsa.setKunciPublik(pubKey.n, pubKey.e);
	var secretKeyIV = rsa.enkripsi(keyIV, rsa.getKunciPublik());

	return secretKeyIV;
}

// decrypt secret keyiv with client rsa key, return keyiv
CryptMsgCtrl.prototype.decryptKeyIV = function (secretKeyIV) {
	var rsa = new RSA();
	var pubKey = this.getClientPubKey();
	var pvtKey = this.getClientPvtKey();
	rsa.setKunciPublik(pubKey.n, pubKey.e);
	rsa.setKunciPrivat(pvtKey);
	var keyIV = rsa.dekripsi(secretKeyIV, rsa.getKunciPrivat(), rsa.getKunciPublik());
	// padding 0 before saving to local storage, keep keyiv length == 48 byte
	if (keyIV.length < 48) {
		for (var i = keyIV.length; i < 48; i++) {
			keyIV = '0' + keyIV;
		}
	}
	return keyIV;
}

// method for encrypt or decrypt message
CryptMsgCtrl.prototype.crypt = function (msg, keyIV) {
	var rabbit = new Rabbit();
	rabbit.setKeyIV(keyIV);
	rabbit.setupKey(rabbit.getKey());
	rabbit.setupIV(rabbit.getIV());
	var crypt = rabbit.crypt(msg);
	return crypt;
}

// ------------ message --------------
// set msgbox to display/hide alert
CryptMsgCtrl.prototype.setMsgBox = function (field, alert, control) {
	this.msgBox.push(field);
	this.msgBox.push(alert);
	this.msgBox.push(control);
	return this.msgBox;
}

// validate msg input
CryptMsgCtrl.prototype.messageValidate = function (e) {
	var msg = this.msgBox[0].val();
	var txtAlert = '';
	// msg empty
	if (msg.length === 0) {
		txtAlert = 'Please enter your message.';
		this._showAlert(txtAlert);
		// msg length > 128
	} else if (msg.length > 129) {
		txtAlert = 'Max 128 characters.';
		this.isValidInput = false;
	} else {
		this.isValidInput = true;
	}
	if (!(this.isValidInput)) {
		this._showAlert(txtAlert);
		// can't press anycode except 'backspace'
		if (e.keyCode !== 8) {
			e.preventDefault();
		} else {
			//return;
		}
	} else {
		// administrator press 'enter'
		if (e.keyCode === 13) {
			// msg not empty
			if (msg.length !== 0) {
				this.msgBox[0].val('');
				return msg;
			} else {
				return;
			}
		}
		this._hideAlert();	
	}
}

// doesExists idMsg in msgs array object
CryptMsgCtrl.prototype.doesExistsMsg = function (msgs, idMsg) {
	var result = $.grep(msgs, function (e) {
		return e.idMsg == idMsg;
	});
	if (result.length == 0) {
		// not found
		return false;
	} else {
		return true;
	}
}

// return message array
CryptMsgCtrl.prototype.setMessage = function (idMsg, sender, receiver, cryptMsg, timestamp) {
	var messages = [];
	var message = { 
		idMsg: idMsg,
		sender: sender, 
		receiver: receiver,
		msg: cryptMsg, 
		timeStamp: timestamp
	};
	messages.push(message);
	return messages;
}

// save msg, key: messages_receiver, sender/receiver: idUsername
CryptMsgCtrl.prototype.saveMessage = function (msgs, receiver, keyIV) {
  var messages;
  var message = {};
  var key = 'messages_' + receiver;
  // get data from local storage
  if (!localStorage[key]) {
    messages = [];
  } else {
    messages = JSON.parse(localStorage[key]);
  }
  // push message to temporary messages array
  for (var i = 0; i < msgs.length; i++) {
  	if (!this.doesExistsMsg(messages, msgs[i].idMsg)) {
  		var msg = this.crypt(msgs[i].msg, keyIV);
  		message.idMsg = msgs[i].idMsg;
			message.sender = msgs[i].sender; 
			message.receiver = msgs[i].receiver;
			message.msg = msg; 
			message.timeStamp = msgs[i].timeStamp;
  		messages.push(message);
  		message = {};
  	}
  }
  
  // parse messages array to local storage
  localStorage[key] = JSON.stringify(messages);
}

// ----- dashboard ---------

// display msg to chat inner
CryptMsgCtrl.prototype.sendMessage = function (idVUsername, msg, timestamp) {
	var split = idVUsername.split('_');
  var idWidget = split[0];
  var vUsername = split[1];
	var regex = new RegExp(idWidget + "/" + vUsername, "g");
	// change message box to enable
  if (regex.test(document.URL)) {
  	$('#chat-message-inner').append('<div class="row msg-sent"><div class="col-sm-10"><p><strong> Me : </strong>'+ msg +'</p></div><div class="col-sm-2 time-stamp">'+ this._formatDate(new Date(timestamp)) +'</div></div>');
  } else {
  	return;
  }
  $('#chat-msg')[0].scrollTop = $('#chat-msg')[0].scrollHeight;
}

// display receive msg to chat inner
CryptMsgCtrl.prototype.receiveMessage = function (idVUsername, msg, timestamp) {
	var split = idVUsername.split('_');
  var idWidget = split[0];
  var vUsername = split[1];
	var regex = new RegExp(idWidget + "/" + vUsername, "g");
	// change message box to enable
  if (regex.test(document.URL)) {
  	if (!($('#chat-message-inner #msg-new').length)) {
  		$('#chat-message-inner').append('<div class="row" id="msg-new"><div class="col-sm-10"><em>\*new messages</em></div></div>');
  	}
  	$('#chat-message-inner').append('<div class="row msg-receive"><div class="col-sm-10"><p><strong> '+ vUsername +' : </strong>'+ msg +'</p></div><div class="col-sm-2 time-stamp">'+ this._formatDate(new Date(timestamp)) +'</div></div>');
  	$('#chat-msg')[0].scrollTop = $('#chat-msg')[0].scrollHeight;
  } else {
  	if ($('#visitor ul.'+ idWidget +' li a#'+ vUsername + ' span.badge').length) {
  		var badgeValue = $('#visitor ul.'+ idWidget +' li a#'+ vUsername + ' span.badge').html();
  		badgeValue = parseInt(badgeValue) + 1;
  		$('#visitor ul.'+ idWidget +' li a#'+ vUsername + ' span.badge').html(badgeValue.toString());
  	} else {
  		$('#visitor ul.'+ idWidget +' li a#'+ vUsername).append('<span class="badge pull-right">1</span>');
  	}
  }
  
}

// read msg
CryptMsgCtrl.prototype.readMessage = function (idVUsername) {
	var split = idVUsername.split('_');
  var idWidget = split[0];
  var vUsername = split[1];
	var regex = new RegExp(idWidget + "/" + vUsername, "g");
	// open dashboard chat
  if (regex.test(document.URL)) {
  	$('#msg-new').remove();
  } else {
  	$('#visitor ul.'+ idWidget +' li a#'+ vUsername + ' span.badge').html('');
  }
}

// get msg from local storage for dashboard
CryptMsgCtrl.prototype.getMessage = function (idVUsername) {
	var key = 'messages_' + idVUsername;
	if (!localStorage[key]) {
		return;
	} else {
		var messages = JSON.parse(localStorage[key]);
		var split = idVUsername.split('_');
		var vUsername = split[1];
		messages.sort(function (a, b) {
			return new Date(a.timeStamp) - new Date(b.timeStamp);
		});
		for (var i = 0; i < messages.length; i++) {
			if ((messages[i].sender === idVUsername)) {
				$('#chat-message-inner').append('<div class="row msg-receive"><div class="col-sm-10"><p><strong>'+ vUsername +' : </strong>'+ messages[i].msg +'</p></div><div class="col-sm-2 time-stamp">'+ this._formatDate(new Date(messages[i].timeStamp)) +'</div></div>');
			} else if ((messages[i].receiver === idVUsername)) {
				$('#chat-message-inner').append('<div class="row msg-sent"><div class="col-sm-10"><p><strong> Me : </strong>'+ messages[i].msg +'</p></div><div class="col-sm-2 time-stamp">'+ this._formatDate(new Date(messages[i].timeStamp)) +'</div></div>');
			}
		}
	}
	$('#chat-msg')[0].scrollTop = $('#chat-msg')[0].scrollHeight;
}

// set visitor online, add class 'online'
CryptMsgCtrl.prototype.setVisitorOnline = function (idVUsername, username) {
	var split = idVUsername.split('_');
  var idWidget = split[0];
  var vUsername = split[1];
  var regex = new RegExp(idWidget + "/" + vUsername, "g");
  // change message box to enable
  if (regex.test(document.URL)) {
  	$('#msg-box').prop('disabled', false);
  }
  if ($('#visitor ul.'+ idWidget +' li a#'+ vUsername).length) {
  	$('#visitor ul.'+ idWidget +' li a#'+ vUsername).parent().addClass('online');
  } else {
  	// add new visitor if not already in list
  	$('#visitor ul.' + idWidget).append('<li class="online"><a id="' + vUsername +'" href="/dashboard/'+ username +'/chat/'+ idWidget +'/'+ vUsername +'">'+ vUsername +'</a>');
  }
}

// set visitor offline, remove class 'online'
CryptMsgCtrl.prototype.setVisitorOffline = function (idVUsername) {
	var split = idVUsername.split('_');
  var idWidget = split[0];
  var vUsername = split[1];
  var regex = new RegExp(idWidget + "/" + vUsername, "g");
  // change message box to disabled
  if (regex.test(document.URL)) {
  	$('#msg-box').prop('disabled', true);
  }
  $('#visitor ul.'+ idWidget +' li a#'+ vUsername).parent().removeClass('online');
}

// add css class if visitor selected
CryptMsgCtrl.prototype.linkSelected = function (idWidget, vUsername) {
	$('#visitor ul.'+ idWidget +' li a#'+ vUsername).css({
		'text-decoration': 'none',
		'background-color': '#ECEEF0',
		'font-weight': 'bold',
		'color': '#333'
	}).click(function(){
		return false;
	});
	// scroll to selected visitor
	$('#visitor').animate({
    scrollTop: $('#visitor ul.'+ idWidget +' li a#'+ vUsername).position().top
	}, 2000);
}

// ----- widget ---------
// display msg to chat inner widget
CryptMsgCtrl.prototype.sendWidgetMessage = function (msg) {
	if ($('#admin-offline').length) {
		return;
	} else if ($('#chat-msg').length) {
		$('#chat-message-inner').append('<div class="row"><div class="col-md-9 msg msg-sent">'+ msg +'</div><div class="col-md-3"><img class="img-rounded" src="/images/ava-visitor.png"></div></div>');
		$('#chat-msg')[0].scrollTop = $('#chat-msg')[0].scrollHeight;
	} else {
		return;
	}
}

// display receive msg to chat inner
CryptMsgCtrl.prototype.receiveWidgetMessage = function (msg) {
	if ($('#admin-offline').length) {
		return;
	} else if ($('#minimize-btn').is(':visible')) {
		if ($('span.badge').length) {
			var badgeValue = $('span.badge').html();
  		badgeValue = parseInt(badgeValue) + 1;
  		$('span.badge').html(badgeValue.toString());
		} else {
			$('#minimize-btn').append('<span class="badge">1</span>');
		}
	} else {
		if (!($('#msg-new').length)) {
  		$('#chat-message-inner').append('<div class="row" id="msg-new"><div class="col-md-10"><em>\*new messages</em></div></div>');
  	}
		$('#chat-message-inner').append('<div class="row"><div class="col-md-3"><img class="img-rounded" src="/images/ava-admin.png"></div><div class="col-md-9 msg msg-receive">'+ msg +'</div></div>');
		$('#chat-msg')[0].scrollTop = $('#chat-msg')[0].scrollHeight;
	}
}

// read msg
CryptMsgCtrl.prototype.readWidgetMessage = function () {
  $('span.badge').html('');
  $('#msg-new').remove();
}

// get msg from local storage for widget
CryptMsgCtrl.prototype.getWidgetMessage = function (idUsername) {
	if ($('#admin-offline').length) {
		return;
	} else {
		var key = 'messages_' + idUsername;
		if (!localStorage[key]) {
			return;
		} else {
			var messages = JSON.parse(localStorage[key]);
			messages.sort(function (a, b) {
				return new Date(a.timeStamp) - new Date(b.timeStamp);
			});
			for (var i = 0; i < messages.length; i++) {
				if ((messages[i].sender === idUsername)) {
					$('#chat-message-inner').append('<div class="row"><div class="col-md-3"><img class="img-rounded" src="/images/ava-admin.png"></div><div class="col-md-9 msg msg-receive">'+ messages[i].msg +'</div></div>');
				} else if ((messages[i].receiver === idUsername)) {
					$('#chat-message-inner').append('<div class="row"><div class="col-md-9 msg msg-sent">'+ messages[i].msg +'</div><div class="col-md-3"><img class="img-rounded" src="/images/ava-visitor.png"></div></div>');
				}
			}
		}
	}
	$('#chat-msg')[0].scrollTop = $('#chat-msg')[0].scrollHeight;	
}