var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 1337});
var Events = require('minivents');
var u = require('./users.js');

var Ev = new Events();
var Users = new u(Ev);

wss.on('connection', function(ws) {
	ws.send(JSON.stringify({ type: 'connected' }));
	ws.on('message', function(message) {
		var m = JSON.parse(message);
		Ev.emit('socket.' + m.type, { resp: m.data, socket: ws });
	});
	ws.on('close', function() {
		console.log('client disconnected');
		Users.removeSocket(ws);
	});
});

Ev.on('socket.auth', function(data) {
	var user = Users.getUser(data.resp.username, data.resp.password);
	if(user)
	{
		user.authenticate(data.socket);
		data.socket.send(JSON.stringify({ type: 'authenticated' }));
		data.socket.send(JSON.stringify({ type: 'chanlog', data: user.getServerLog('local') }));
	}
});

Ev.on('socket.join', function(data) {

});

Ev.on('socket.say', function(data) {
	Users.getUserBySocket(data.socket).send(data.resp.serverName, data.resp.channel, data.resp.message);
});

Ev.on('irc.say', function(data) {
	Users.getAllUserSockets(data.user).forEach(function(socket) {
		socket.send(JSON.stringify({ type: 'chanMsg', data: data.data }));
	});
});