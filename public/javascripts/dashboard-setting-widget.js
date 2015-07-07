// copy to clipboard function
var client = new ZeroClipboard(document.getElementById('copy-btn'));

client.on('ready', function (readyEvent) {
	//alert('zeroclipboard swf is ready!');

	client.on('aftercopy', function (event) {
		//event.target.style.display = 'none';
		//alert('copied text to clipboard: ' + event.data['text/plain']);
		alert('Charsabit live chat script copied.');
	});
});




