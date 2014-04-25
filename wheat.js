var config = require('./config.js');
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 1337});
var Events = require('minivents');
var u = require('./users.js');

var Bookshelf  = require('bookshelf');

config.db.connection = Bookshelf.initialize({
	client: 'mysql',
	connection: {
		host: config.db.server,
		user: config.db.username,
		password: config.db.password,
		database: config.db.db,
		charset: 'utf8'
	}
});





// 

var Ev = new Events();
// var Users = new u(Ev);
var Users = new u();

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
	// var user = Users.getUser(data.resp.username, data.resp.password);
	console.log('auth')
	// if(user)
	// {
		/*user.authenticate(data.socket);
		data.socket.send(JSON.stringify({ type: 'authenticated' }));
		// data.socket.send(JSON.stringify({ type: 'chanlog', data: user.getServerLog('local') }));
		data.socket.send(JSON.stringify({ type: 'chanlog', data: user.getServersLog() }));
		data.socket.send(JSON.stringify({ type: 'servers', data: user.getServers() }));
		console.log("%s authenticated", data.resp.username);*/
	// }
});

Ev.on('socket.join', function(data) {
	var user = Users.getUserBySocket(data.socket);
	if(user)
		user.joinChannel(data.resp.server, data.resp.channel);
});

Ev.on('socket.setNick', function(data) {
	var user = Users.getUserBySocket(data.socket);
	if(user)
		user.setNick(data.resp.server, data.resp.nick);
});

Ev.on('socket.partChannel', function(data) {
	var user = Users.getUserBySocket(data.socket);
	if(user)
		user.partChannel(data.resp.server, data.resp.channel);
});

Ev.on('socket.disconnect', function(data) {
	var user = Users.getUserBySocket(data.socket);
	if(user)
		user.disconnect(data.server);
});

Ev.on('socket.say', function(data) {
	Users.getUserBySocket(data.socket).send(data.resp.serverName, data.resp.channel, data.resp.message);
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
   console.log(data);
});
