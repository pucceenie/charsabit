$(function(){
	// remove keyiv and message
	var kripto = new CryptMsgCtrl();
	kripto.removeKeyAndMessage();

	// description fade-in/out effect
	var iScrollPos = 0; 
	$(window).scroll(function () {
		var iCurScrollPos = $(this).scrollTop();
		if (iCurScrollPos > iScrollPos) {
			$("#description").fadeIn("slow");
		} else {
			$("#description").fadeOut("slow");
		}
		iScrollPos = iCurScrollPos;
	});

})