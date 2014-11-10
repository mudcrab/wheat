var config = require('./config.js');
var WebSocketServer = require('ws').Server;
var db = require('./db.js');
var Events = require('minivents');
var Log = require('./helpers/log.js');
var helper = require('./helpers/socket_helper.js');
var users = require('./users.js');
var express = require('express');
var crypto = require('crypto');
var shasum = crypto.createHash('sha1');
var app = express();

// Configuration

config.env = process.env.NODE_ENV || 'development';
config.events = new Events();
config.logger = new Log('log/' + config.env + '.log', { echo: false, timestamp: true });
config.server = new WebSocketServer({ port: config.app.ports[config.env] });

config.logger.info("Started (%s) socket server on %d", config.env, config.app.ports[config.env]);

// Set up socket server

users.init();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function(req, res) {
    res.send('hi');
});

// TODO should be a POST

app.get('/auth/:username/:password', function(req, res) {
	var status = users.auth(req.params.username, req.params.password, function(userData) {
		if(userData)
		{
			var rnd = shasum.update(new Buffer("loler1").toString('base64'));
			var hash = rnd.digest('hex');
			
			config.apiClients[userData.id + '_' + userData.email] = config.apiClients[userData.id + '_' + userData.email] || [];
			
			config.apiClients[userData.id + '_' + userData.email].push(hash);
			
			res.send({
				hash: hash,
				status: true,
				data: userData
			});
		}
		else
		{
			res.send( JSON.stringify({
				status: false
			}));
		}
	});
});

if(process.env.NODE_ENV === 'development')
{
	config.apiClients["9db68c4216a29a24cd93a7df5ea15bb8b4abb411"] = {
		id: 1,
		email: 'jevgeni@pitfire.eu'
	};
}

app.get('/messages/:server/:channel/:limit/:hash', function(req, res) {
	var ret = {
		status: false
	};
	
	if(config.apiClients.hasOwnProperty(req.params.hash))
	{
		var userData = config.apiClients[req.params.hash];
		ret.status = true;

		new db.models.Logs()
		.query(function(qb) {
			qb.where('server_id', '=', req.params.server)
			.andWhere('channel_id', '=', req.params.channel)
			.orderBy('id', 'ASC')
			.limit(parseInt(req.params.limit))
		})
		.fetch()
		.then(function(logs) {
			ret.data = logs.toJSON();
			res.json(ret);
		});
	}
	else
		res.json(ret);

});

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
					var rnd = new Buffer(Math.random() * 1000).toString('base64');
					u = new users.User(userData.get('id'), userData.get('email'), client, rnd);
					u.addModel(userData);
					config.clients[u.id + '_' + u.email] = config.clients[u.id + '_' + u.email] || [];
					config.clients[u.id + '_' + u.email].push(u);
					client.user = { id: u.id, email: u.email };
					client.encoded = u.encoded;
					client.send(helper.socketData('auth', { status: true }));
				}
				else
					client.send(helper.socketData('auth', { status: false }));
			});
		}
		else
		{
			config.events.emit('socket.' + client.encoded + '.' + message.type, {
				response: message.data,
				socket: client
			});
		}

		config.logger.log("SOCKET - %s", message.type);
	});

	client.on('close', function() {
		try {
			config.clients[client.user.id + '_' + client.user.email].forEach(function(cl, i) {
				if(cl.socket == client)
				{
					config.clients[client.user.id + '_' + client.user.email].splice(i, 1);
					return;
				}
			});
		} catch(e) {
			config.logger.error('Could not remove socket from client');
		}
	});
});

var server = app.listen(3000, function() {
    var host = server.address().address;
    var port = server.address().port;
    
    console.log('server listening at http://%s:%s', host, port);
});