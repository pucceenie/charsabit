$(function () {
	// focus on password field after success signup
	if (document.URL !== 'http://localhost:3000/login') {
		$('#login-password').focus();
	}
});