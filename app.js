var config = require('./config.js');
var WebSocketServer = require('ws').Server;
var db = require('./db.js');
var Events = require('minivents');
var Log = require('./helpers/log.js');
var helper = require('./helpers/socket_helper.js');
var users = require('./users.js');

// Configuration

config.env = process.env.NODE_ENV || 'development';
config.events = new Events();
config.logger = new Log('log/' + config.env + '.log', { echo: false, timestamp: true });
config.server = new WebSocketServer({ port: config.app.ports[config.env] });

config.logger.info("Started (%s) socket server on %d", config.env, config.app.ports[config.env]);

// Set up socket server

users.init();

config.server.on('connection', function(client) {
	client.send(helper.socketData('connected'));
	config.logger.info('Client connected');

	client.on('message', function(json) {
		var message = JSON.parse(json);
		var u = null;

		if(message.type === 'auth')
		{
			users.auth(message.data.email, message.data.password, function(userData) {
				if(userData)
				{
					u = new users.User(userData.get('id'), userData.get('email'), client);
					u.addModel(userData);
					config.clients[u.id + '_' + u.email] = config.clients[u.id + '_' + u.email] || [];
					config.clients[u.id + '_' + u.email].push(u);
					client.user = { id: u.id, email: u.email };
				}
			});
		}
		else
		{
			config.events.emit('socket.' + client.user.id + '_' + client.user.email + '.' + message.type, {
				response: message.data,
				socket: client
			});
		}

		config.logger.log("SOCKET - %s", message.type);
	});

	client.on('close', function() {
		config.clients[client.user.id + '_' + client.user.email].forEach(function(cl, i) {
			if(cl.socket == client)
			{
				config.clients[client.user.id + '_' + client.user.email].splice(i, 1);
				return;
			}
		});
	});
});