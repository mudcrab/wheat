var config = require('./config.js');
var WebSocketServer = require('ws').Server;
var db = require('./db.js');
var Events = require('minivents');
var Log = require('./log.js');
var Users = require('./users.js');
var UsersManager = new Users();
var helper = require('./helper.js');

// Configuration

config.env = process.env.NODE_ENV || 'development';
config.events = new Events();
config.logger = new Log('log/' + config.env + '.log', { echo: false, timestamp: true });
config.server = new WebSocketServer({ port: config.app.ports[config.env] });

config.logger.info("Started (%s) socket server on %d", config.env, config.app.ports[config.env]);

// Set up socket server

config.server.on('connection', function(client) {
	client.send(helper.socketData('connected'));
	config.logger.info('Client connected');

	client.on('message', function(json) {
		var message = JSON.parse(json);

		if(message.type === 'auth')
		{
			config.events.emit('socket.' + message.type, {
				response: message.data,
				socket: client
			});
		}
		else
		{
			var user = UsersManager.findUserBySocket(client);

			if(user)
				config.events.emit('socket.' + message.type, {
					response: message.data,
					socket: client,
					user: user
				});
			else
				config.logger.error("User socket not found");
		}

		config.logger.log("SOCKET - %s", message.type);
	});
});

// Socket server event listeners

config.events.on('socket.auth', function(data) {
	if(UsersManager.findUser(data.response.username, data.response.password, data.socket))
	{
		data.socket.send(helper.socketData('auth', { status: 'authenticated' }));
		config.events.off('socket.auth');
		config.logger.info("User %s authenticated", data.response.username);
	}
});

/*
	Client's irc actions
*/

config.events.on('socket.irc.connect', function(data) {
	data.user.addServer(data.response.name, data.response.address, data.response.nick, data.response.autojoin, function() {
		data.socket.send(helper.socketData('connectServer', { status: 'connected' }));
	});
	config.events.off('socket.irc.connect');
});

config.events.on('socket.irc.disconnect', function(data) {
	var status = data.user.disconnectServer(data.response.name);
	data.socket.send(helper.socketData('disconnectServer', { status: status }));
	config.events.off('socket.irc.disconnect');
});

config.events.on('socket.irc.join', function(data) {
	data.user.joinChannel(data.response.server, data.response.channel); // TODO add callback?
	config.events.off('socket.irc.join');
});

config.events.on('socket.irc.part', function(data) {
	data.user.partChannel(data.response.server, data.response.channel); // TODO add callback?
	config.events.off('socket.irc.part');
});

config.events.on('socket.irc.say', function(data) {
	data.user.sendMessage(data.response.serverName, data.response.channel, data.response.message);
	config.events.off('socket.irc.say');
});

config.events.on('socket.irc.servers', function(data) {
	data.socket.send(helper.socketData('servers', { servers: data.user.getServers() }));
});

config.events.on('socket.irc.channels', function(data) {

});

/*
	Server's irc actions
*/

config.events.on('irc.connected', function(data) {
	data.users.forEach(function(user) {
		user.send(helper.socketData('serverConnected', { server: data.server.name }));
	});
});

config.events.on('irc.join', function(data) {

});