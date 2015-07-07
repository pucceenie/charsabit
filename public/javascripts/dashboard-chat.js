$(function () {
	// initiate socket.io
	var socket = io();

	// instantiate cryptMsgCtrl
	var cryptMsgControl = new CryptMsgCtrl();

	// initate variable
	var $alertMsgBox = $('#msg-box-alert');
	var $fieldMsg = $('#msg-box');
	var $controlMsg = $fieldMsg.parent();

	// create highlight effect to selected visitor
	cryptMsgControl.linkSelected(idWidget, vUsername);

	// initialize MessageCtrl property
	cryptMsgControl.setMsgBox($fieldMsg, $alertMsgBox, $controlMsg);

	// get unread msg
	if ($('#visitor ul.'+ idWidget +' li a#'+ vUsername + ' span.badge').length) {
		socket.emit('get unread msg', { sender: idVUsername, receiver: idUsername });
	} else {
		// get message from localstorage if exists, and display to inner chat
		cryptMsgControl.getMessage(idVUsername);
	}

	// save unread msg to local storage
	socket.on('set unread msg', function (data) {
		cryptMsgControl.saveMessage(data, idVUsername, cryptMsgControl.getServerKeyIV());
		cryptMsgControl.getMessage(idVUsername);
		$('#chat-message-inner div.row:nth-last-child('+ data.length +')').prepend('<div class="row" id="msg-new"><div class="col-sm-10"><em>\*new messages</em></div></div>');
		$('#visitor ul.'+ idWidget +' li a#'+ vUsername + ' span.badge').html('');
		if (cryptMsgControl.msgBox[0].is(':disabled')) {
			setTimeout(
				function () {
					socket.emit('read msg', { sender: idVUsername, receiver: idUsername, role: 'administrator' });
				}, 2000);
		}
	})

	
	// focus to msgbox, emit read msg
	cryptMsgControl.msgBox[0].focus(function () {
		if ($('#msg-new').length) {
			//$('#msg-new').remove();
			socket.emit('read msg', { sender: idVUsername, receiver: idUsername, role: 'administrator' });
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
			socket.emit('send msg', { cryptMsg: cryptMsg, sender: idUsername, receiver: idVUsername, role: 'administrator' });
		}
	});

	// keep the scroll in bottom of chat inner
	$('#chat-msg')[0].scrollTop = $('#chat-msg')[0].scrollHeight;
})