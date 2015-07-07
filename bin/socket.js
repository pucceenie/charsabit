var socketio = require('socket.io');

function init (server) {
	var io = socketio(server);
	io.on('connection', function (socket) {
		console.log('socket connected');
		socket.on('disconnect', function () {
			console.log('socket disconnected....');
		})
	})
	return io;
}

module.exports = init;