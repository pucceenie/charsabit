$(document).ready(function(){
	// disabled the message box
	$('#msg-box').prop('disabled', true);
	// hide the logout icon
	$('#logout-icon').hide();
	
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