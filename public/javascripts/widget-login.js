$(document).ready(function(){
	// remove keyiv and message
	var kripto = new CryptMsgCtrl();
	kripto.removeKeyAndMessage();
	
	// disabled the message box
	$('#msg-box').prop('disabled', true);
	// hide the logout icon
	$('#logout-icon').hide();

	// focus on password field after success signup
	if (!(/login$/.test(document.URL))) {
		$('#login-password').focus();
	}

	// minimize icon click, show the minimize button
	$('#minimize-icon').click(function(){
		$('#widget').hide();
		$('#minimize-btn').show();
	});

	// minimize button click, show the widget
	$('#minimize-btn').click(function(){
		$('#widget').show();
		$(this).hide();
	});
});