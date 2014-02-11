var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 8081});
var Events = require('minivents');
// var irc = require('irc');

var client;
var Ev = new Events();

var ServerManager = require('./servermanager.js');
var UserManager = require('./usermanager.js');
var User = require('./user.js');

// console.log(User, UserManager)
// console.log(sman)
// var servers = {};

var userMana = null;

// temp
// real / irc
var usernameMap = {
	jevgeni: 'khvhr_'
};

function getSocketUser()
{
	var username = null;
	for(var name in usernameMap)
	{
		if (usernameMap[name] == client.opt.nick)
			username = name;
	}
	return username;
};

// var sManager = new ServerManager();
// sManager.connect('local', 'localhost' { socketUser: 'jevgeni', username: 'khvhr_', realName: 'j', userName: 'j' });
/*setTimeout(function() {
	sManager.join('local', '#test', function() { console.log('ok') })
}, 1000);*/

var connectedClients = [];

var userManager = new UserManager();

wss.on('connection', function(ws) {
	ws.on('message', function(message) {
		var m = JSON.parse(message);
		// console.log(m)
		Ev.emit('socket.' + m.type, { response: m.data, socket: ws });
	});
});


Ev.on('socket.auth', function(data) {
	userManager.addUser(new User(data.response.username));
	userManager.getUser(data.response.username).addSocket(data.socket);

	/*userManager.getUserBySocket(data.socket).addServer('local', 'localhost', 'khvhr_', {
		realName: 'j',
		userName: 'j'
	});*/
	/*userManager.addUser(data.user.username, data.socket);
	userManager.addServer('blah');*/
	/*var u = new User(data.user.username);
	u.addSocket(data.socket);*/
});

Ev.on('socket.connect', function(data) {
	// console.log(userManager.getUserBySocket(data.socket));
	var user = userManager.getUserBySocket(data.socket);
	console.log(data.response.length)
	if(data.response.length == 2)
	{
		console.log('connecting')
		user.addServer(data.response[0], data.response[1], 'jk', {
			realName: 'tere',
			userName: 'tere'
		});
	}/*
	userManager.getUser(data.user.username).addServer(data.server.name, data.server.addr, data.server.username, {
		realName: data.server.realName,
		userName: data.server.userName
	})*/
	
});

Ev.on('socket.join', function(data) {
	var user = userManager.getUserBySocket(data.socket);

	user.servers.join('local', '#test', function() { console.log('a') });
});

Ev.on('socket.say', function(data) {
	
});