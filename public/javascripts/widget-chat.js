$(document).ready(function(){
	// initiate socket.io
	var socket = io();
	// instantiate CryptMsgCtrl
	var cryptMsgControl = new CryptMsgCtrl();

	// initate variable
	var $alertMsgBox = $('#msg-box-alert');
	var $fieldMsg = $('#msg-box');
	var $controlMsg = $fieldMsg.parent();

	// initialize MessageCtrl property
	cryptMsgControl.setMsgBox($fieldMsg, $alertMsgBox, $controlMsg);

	// get message from localstorage if exists, and display to inner chat
	cryptMsgControl.getWidgetMessage(idUsername);

	// on socket connect
	socket.on('connect', function () {
		
	});

	/*socket.emit('get msg', { idUsername: idUsername, idVUsername: idVUsername });*/

	/*socket.on('set msg', function (data) {
		console.log(data);
		//cryptMsgControl.getWidgetMessage(idUsername);
	})*/

	// on socket 'server pubkey', receive server pubkey
	socket.on('server pubkey', function (pubkey) {
		// save to local storage
		cryptMsgControl.saveServerPubKey(pubkey.n, pubkey.e);
		// if there is no client RSA key, generate one and save to local storage
		if (!cryptMsgControl.isAvailableRSAKey()) {
			cryptMsgControl.generateAndSaveRSAKey();
		}
		// emit 'client pubkey', send the client pubkey
		socket.emit('client pubkey', cryptMsgControl.getClientPubKey());
	});


	// on socket 'server keyiv', receive server secretkeyiv
	socket.on('server keyiv', function (secretkeyiv) {
		// decrypt the secretkeyiv
		var serverkeyiv = cryptMsgControl.decryptKeyIV(secretkeyiv);
		// save to local storage
		cryptMsgControl.saveServerKeyIV(serverkeyiv);
		// if there is no client keyiv, generate one and save to local storage
		if (!cryptMsgControl.isAvailableKeyIV()) {
			cryptMsgControl.generateAndSaveKeyIV();
		}
		// emit 'client keyiv', send encrypted client keyiv
		socket.emit('client keyiv', cryptMsgControl.encryptKeyIV());
	});


	// on socket 'admin offline', receive admin idUsername
	socket.on('admin online', function (data) {
		// reload the widget
		location.reload();
	});


	// on socket 'visitor online', do nothing
	socket.on('visitor online', function (data) {
		//console.log('visitor: ' + data + 'online');
	});


	// on socket 'admin offline', receive admin idUsername
	socket.on('admin offline', function (data) {
		// reload the widget
		location.reload();
	});


	// on socket 'visitor offline', do nothing
	socket.on('visitor offline', function (data) {
		//console.log('visitor: ' + data + 'offline');
		if (idVUsername === data) {
			window.location.href = '/widget/' + idWidget + '/login';
		}
	});


	// receive msg
	// data { idMessage: _id, 
	//        cryptMsg: cryptMsg, 
	//        sender: sender, 
	//        receiver: receiver,
	//        timeStamp: timeSent }
	socket.on('receive msg', function (data) {
		// save msg to db
		cryptMsgControl.saveMessage(cryptMsgControl.setMessage(data.idMessage, data.sender, data.receiver, data.cryptMsg, data.timeStamp), data.sender, cryptMsgControl.getServerKeyIV());
		// decrypt msg
    var msg = cryptMsgControl.crypt(data.cryptMsg, cryptMsgControl.getServerKeyIV());
    cryptMsgControl.receiveWidgetMessage(msg);

    $.titleAlert("new message!", {
    	requireBlur: true,
    	stopOnFocus: true,
    	//duration: 10000,
    	interval: 500
    })
	});

	// receive back msg from msg that user sent
	// data { idMessage: _id, 
	//        cryptMsg: cryptMsg, 
	//        sender: sender, 
	//        receiver: receiver,
	//        timeStamp: timeSent }
	socket.on('receive back msg', function (data) {
		// save msg to db
		cryptMsgControl.saveMessage(cryptMsgControl.setMessage(data.idMessage, data.sender, data.receiver, data.cryptMsg, data.timeStamp), data.receiver, cryptMsgControl.getServerKeyIV());
		// decrypt msg
		var msg = cryptMsgControl.crypt(data.cryptMsg, cryptMsgControl.getServerKeyIV());
		// display the msg
		cryptMsgControl.sendWidgetMessage(msg);
	})

	// remove new msg
	// data {
	// 		sender: sender,
	//		receiver: receiver
	// }
	socket.on('read msg notification', function (data) {
		cryptMsgControl.readWidgetMessage();
	});

	// save unread msg to local storage
	socket.on('set unread msg', function (data) {
		cryptMsgControl.saveMessage(data, idUsername, cryptMsgControl.getServerKeyIV());
		$('#widget').show();
		$('#chat-message-inner').empty();
		cryptMsgControl.getWidgetMessage(idUsername);
		$('#minimize-btn').hide();
		$('#chat-message-inner div.row:nth-last-child('+ data.length +')').prepend('<div class="row" id="msg-new"><div class="col-md-10"><em>\*new messages</em></div></div>');
	})

	cryptMsgControl.msgBox[0].focus(function () {
		if ($('#msg-new').length) {
			//$('#msg-new').remove();
			socket.emit('read msg', { sender: idUsername, receiver: idVUsername, role: 'visitor' });
		}
	})
	
	// on msgBox keydown
	cryptMsgControl.msgBox[0].keydown(function (e) {
		// validate the input, return user input
		// if empty, display errMsg
		// if > 128 character, display errMsg
		var msg = cryptMsgControl.messageValidate(e);
		// timestamp = current date
		var timestamp = new Date();
		// if there is error msg
		if (! msg) { 

		} else {
			// encrypt the msg
			var cryptMsg = cryptMsgControl.crypt(msg, cryptMsgControl.getClientKeyIV());
			// emit to server, the crypt msg, sender, and receiver, role
			socket.emit('send msg', { cryptMsg: cryptMsg, sender: idVUsername, receiver: idUsername, role: 'visitor' });
		}
	});

	// minimize icon click, show the minimize button
	$('#minimize-icon').click(function(){
		$('#widget').hide();
		$('#minimize-btn').show();
	});

	// minimize button click, show the widget
	$('#minimize-btn').click(function(){
		// get unread msg
		if ($('span.badge').length) {
			if ($('span.badge').html() !== '') {
				socket.emit('get unread msg', { sender: idUsername, receiver: idVUsername });
			} else {
				// get message from localstorage if exists, and display to inner chat
				$('#widget').show();
				$('#chat-message-inner').empty();
				cryptMsgControl.getWidgetMessage(idUsername);
				$(this).hide();
			}
		} else {
			// get message from localstorage if exists, and display to inner chat
			$('#widget').show();
			$('#chat-message-inner').empty();
			cryptMsgControl.getWidgetMessage(idUsername);
			$(this).hide();
		}
	});

	// keep the scroll in bottom of chat inner
	if ($('#chat-msg').length) {
		$('#chat-msg')[0].scrollTop = $('#chat-msg')[0].scrollHeight;
	}

});


