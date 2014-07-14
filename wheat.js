var config = require('./config.js');
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: config.app.ports[process.env.NODE_ENV] || 1337 });
var Events = require('minivents');
var u = require('./users.js');
var db = require('./db.js');

var Ev = new Events();
var Users = new u();
config.events = Ev;	

// console.log('WHEAT', config.app.ports[process.env.NODE_ENV])

wss.on('connection', function(ws) {
	ws.send(JSON.stringify({ type: 'connected' }));
	ws.on('message', function(message) {
		var m = JSON.parse(message);
		Ev.emit('socket.' + m.type, { resp: m.data, socket: ws });
		// console.log("[ SCK ] %s", m.type, m.data);
	});
	ws.on('close', function() {
		Users.removeSocket(ws);
	});
});

Ev.on('socket.auth', function(data) {
	var user = Users.findUser(data.resp.username, data.resp.password, data.socket);
	if(user)
	{
		// /*user.authenticate(data.socket);
		data.socket.send(JSON.stringify({ type: 'auth', data: { status: 'authenticated' } }));
		// data.socket.send(JSON.stringify({ type: 'chanlog', data: user.getServerLog('local') }));
		data.socket.send(JSON.stringify({ type: 'chanlog', data: user.getServersLog() }));
		// data.socket.send(JSON.stringify({ type: 'servers', data: user.getServers() }));
		// console.log("%s authenticated", data.resp.username);
	}
});

Ev.on('socket.join', function(data) {
	var user = Users.findUserBySocket(data.socket);
	if(user)
		user.joinChannel(data.resp.server, data.resp.channel);
});

Ev.on('socket.connectServer', function(data) {
	var user = Users.findUserBySocket(data.socket);
	// console.log(user)
	if(user)
		data.socket.send(JSON.stringify({ type: 'connectServer', data: { status: 'connected' } }))
})

Ev.on('socket.setNick', function(data) {
	var user = Users.findUserBySocket(data.socket);
	if(user)
		user.setNick(data.resp.server, data.resp.nick);
});

Ev.on('socket.partChannel', function(data) {
	var user = Users.findUserBySocket(data.socket);
	if(user)
		user.partChannel(data.resp.server, data.resp.channel);
});

Ev.on('socket.disconnect', function(data) {
	var user = Users.findUserBySocket(data.socket);
	if(user)
		user.disconnect(data.server);
});

Ev.on('socket.say', function(data) {
	Users.findUserBySocket(data.socket).sendMessage(data.resp.serverName, data.resp.channel, data.resp.message);
});

Ev.on('irc.say', function(data) {
	data.users.forEach(function(user) {
		user.send(JSON.stringify({ type: 'chanMsg', data: data.data  }));
	});
	/*Users.getAllUserSockets(data.user).forEach(function(socket) {
		socket.send(JSON.stringify({ type: 'chanMsg', data: data.data }));
	});*/
});

Ev.on('irc.connected', function(data) {

	data.users.forEach(function(user) {
		user.send(JSON.stringify({ type: 'serverConnected', server: data.server.name }));
	});

	/*var u = Users.getUser('jk', 'asdf1234');
	u.joinChannel('local', '#blah');

	u.setNick('local', 'jk_');
	u.send('local', '#blah', 'tere');
	u.partChannel('local', '#blah');
	u.send('local', 'kohvihoor', 'tere :)');
	u.disconnect('local');

	setTimeout(function() {

	}, 2000);*/
});

Ev.on('irc.join', function(data) {
   // console.log(data);
});

module.exports = { wss_: wss, db_: db };