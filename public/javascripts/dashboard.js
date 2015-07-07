$(function(){
	// initiate socket.io
	var socket = io();

	// instantiate cryptMsgCtrl
	var cryptMsgControl = new CryptMsgCtrl();

	// on socket connect
	socket.on('connect', function () {
		
	});

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
		//console.log('admin: ' + data + 'online');
	});

	// on socket 'visitor online', do nothing
	socket.on('visitor online', function (data) {
		cryptMsgControl.setVisitorOnline(data, username);

		//console.log('visitor: ' + data + 'online');
	});

	// on socket 'admin offline', receive admin idUsername
	socket.on('admin offline', function (data) {
		window.location.href = '/';
		//console.log('admin: ' + data + 'offline');
	});

	// on socket 'visitor offline', do nothing
	socket.on('visitor offline', function (data) {
		cryptMsgControl.setVisitorOffline(data);
		//console.log('visitor: ' + data + 'offline');
	});

	// receive msg
	// data { idMessage: _id, 
	//        cryptMsg: cryptMsg, 
	//        sender: sender, 
	//        receiver: receiver,
	//        timeStamp: timeSent }
	socket.on('receive msg', function (data) {
		//console.log('msg: ' + data.cryptMsg);
		// save msg to db
		cryptMsgControl.saveMessage(cryptMsgControl.setMessage(data.idMessage, data.sender, data.receiver, data.cryptMsg, data.timeStamp), data.sender, cryptMsgControl.getServerKeyIV());
		// decrypt msg
    var msg = cryptMsgControl.crypt(data.cryptMsg, cryptMsgControl.getServerKeyIV());
    //console.log('decrypt msg: ' + msg);
    
		// display the msg
    cryptMsgControl.receiveMessage(data.sender, msg, data.timeStamp);
    $.titleAlert("new message!", {
    	requireBlur: true,
    	stopOnFocus: true,
    	//duration: 10000,
    	interval: 500
    });
	});

	// receive back msg from msg that user sent
	// data { idMessage: msg._id, 
	//        cryptMsg: cryptMsg, 
	//        sender: data.sender, 
	//        receiver: data.receiver,
	//        timeStamp: data.timeSent }
	socket.on('receive back msg', function (data) {
		// save msg to db
		cryptMsgControl.saveMessage(cryptMsgControl.setMessage(data.idMessage, data.sender, data.receiver, data.cryptMsg, data.timeStamp), data.receiver, cryptMsgControl.getServerKeyIV());
		// decrypt msg
		var msg = cryptMsgControl.crypt(data.cryptMsg, cryptMsgControl.getServerKeyIV());
		// display the msg
		cryptMsgControl.sendMessage(data.receiver, msg, data.timeStamp);
	});

	// remove new msg
	// data {
	// 		sender: sender,
	//		receiver: receiver
	// }
	socket.on('read msg notification', function (data) {
		cryptMsgControl.readMessage(data.sender);
	});

	//regex to test
	var urlHome = /^(?!.*\bsetting-widget\b)(?!.*\bsetting-data-personal\b)(?!.*\bchat\b).*$/; //ntar diganti
	var urlWidget = /\bsetting-widget\b/;
	var urlDataPersonal = /\bsetting-data-personal\b/;
	var urlVisitorList = /\bchat\b/;

	var $menuHome = $('#home-menu').parents();
	var $menuWidget = $('#setting-widget-menu').parents();
	var $menuDataPersonal = $('#setting-data-personal-menu').parents();
	var $menuVisitorList = $('#visitor-list-menu').parents();

	var actualUrl = $(location).attr('href');

	//set menu active
	//menu data personal active
	if (urlDataPersonal.test(actualUrl)){
		$menuDataPersonal.addClass('active');
		$menuWidget.removeClass('active');
		$menuHome.removeClass('active');
		$menuVisitorList.removeClass('active');
	}
	//menu setting widget active
	else if (urlWidget.test(actualUrl)){
		$menuWidget.addClass('active');
		$menuHome.removeClass('active');
		$menuDataPersonal.removeClass('active');
		$menuVisitorList.removeClass('active');
	}
	//menu visitor list active
	else if (urlVisitorList.test(actualUrl)){
		$menuVisitorList.addClass('active');
		$menuWidget.removeClass('active');
		$menuHome.removeClass('active');
		$menuDataPersonal.removeClass('active');
		$('#visitor').addClass('in');
		$('#button-toggle').removeClass('glyphicon-triangle-bottom');
		$('#button-toggle').addClass('glyphicon-triangle-top');
	}
	//menu home active
	else if (urlHome.test(actualUrl)){
		$menuHome.addClass('active');
		$menuWidget.removeClass('active');
		$menuDataPersonal.removeClass('active');
		$menuVisitorList.removeClass('active');
	}

	$('#visitor-list-menu').click(function () {
		if ($('#visitor').hasClass('in')) {
			$('#button-toggle').removeClass('glyphicon-triangle-top');
			$('#button-toggle').addClass('glyphicon-triangle-bottom');
		} else {
			$('#button-toggle').removeClass('glyphicon-triangle-bottom');
			$('#button-toggle').addClass('glyphicon-triangle-top');
		}
	});

});
