var config = require('./config.js');
var users = require('./users.js');
var irc = require('irc');
var db = require('./db.js');
var helper = require('./helpers/socket_helper.js')

var User = function(id, email, socket, encStr)
{
	this.id = id;
	this.email = email;
	this.socket = socket;
	this.sId = this.id + '_' + this.email;
	this.encoded = encStr;
	this.dbServers = null;

	config.events.on('socket.' + this.encoded + '.irc.connect', this.connect, this);
	config.events.on('socket.' + this.encoded + '.irc.disconnect', this.disconnect, this);
	config.events.on('socket.' + this.encoded + '.irc.join', this.join, this);
	config.events.on('socket.' + this.encoded + '.irc.part', this.part, this);
	config.events.on('socket.' + this.encoded + '.irc.say', this.say, this);
	config.events.on('socket.' + this.encoded + '.irc.servers', this.servers, this);
	config.events.on('socket.' + this.encoded + '.irc.channels', this.channels, this);
	config.events.on('socket.' + this.encoded + '.irc.names', this.names, this);
};

User.prototype.initServers = function(cb)
{
	var self = this;
	this.model.related('servers').each(function(server) {
		self.addIrcListeners(server.get('id'), server.get('name'), self.id);
	});
	self.updateServers(function() {
		self.onConnect();
	});
};

User.prototype.updateServers = function(cb)
{
	var self = this;
	this.model.related('servers').fetch()
	.then(function(servers) {
		self.dbServers = servers;
	})
	.then(function() {
		if(typeof cb !== 'undefined')
			cb();
	});
};

User.prototype.addIrcListeners = function(id, name, uid)
{
	var self = this;
	var sId = id + '_' + name + '_' + uid;

	config.events.on('irc.' + sId + '.registered', function(data) {
		try
		{
			self.socket.send(helper.socketData('irc.registered', { status: true, server: name }));
		}
		catch(e)
		{
			config.logger.error('Socket not opened');
		}
	});

	config.events.on('irc.' + sId + '.join', function(data) {
		try
		{
			self.socket.send(helper.socketData('irc.joined', { status: true, server: name, channel: data.channel, nick: data.nick }));
		}
		catch(e)
		{
			config.logger.error('Socket not opened');
		}
	});

	config.events.on('irc.' + sId + '.error', function(data) {
		config.logger.error('IRC error for uid %d on %s connection', uid, name);
		config.logger.error(data);
	});

	config.events.on('irc.' + sId + '.message', function(data) {
		if(self.socket._socket != null)
		{
			try
			{
				self.socket.send(helper.socketData('irc.message', {
					server: name,
					from: data.from,
					to: data.to,
					message: data.message
				}));
			}
			catch(e)
			{
				config.logger.error('Socket not opened');
			}
		}
	});

	config.events.on('irc.' + sId + '.names', function(data) {
		try 
		{
			self.socket.send(helper.socketData('irc.names', data));
		}
		catch(e)
		{
			config.logger.error('Socket not opened');
		}
	});

	config.events.on('irc.' + sId + '.topic', function(data) {
		try 
		{
			self.socket.send(helper.socketData('irc.topic', data));
		}
		catch(e)
		{
			config.logger.error('Socket not opened');
		}
	});

	config.events.on('irc.' + sId + '.part', function(data) {
		try
		{
			self.socket.send(helper.socketData('irc.part', data));
		}
		catch(e)
		{
			config.logger.error('Socket not opened');
		}
	});

	config.events.on('irc.' + sId + '.quit', function(data) {
		try 
		{
			self.socket.send(helper.socketData('irc.quit', data));
		}
		catch(e)
		{
			config.logger.error('Socket not opened');
		}
	});

	config.events.on('irc.' + sId + '.kick', function(data) {
		try
		{
			self.socket.send(helper.socketData('irc.kick', data));
		}
		catch(e)
		{
			config.logger.error('Socket not opened');
		}
	});

	config.events.on('irc.' + sId + '.pm', function(data) {
		try
		{
			self.socket.send(helper.socketData('irc.pm', data));
		}
		catch(e)
		{
			config.logger.error('Socket not opened');
		}
	});

	config.events.on('irc.' + sId + '.nick', function(data) {
		try
		{
			self.socket.send(helper.socketData('irc.nick', data));
		}
		catch(e)
		{
			config.logger.error('Socket not opened');
		}
	});
};

User.prototype.connect = function(data)
{
	var self = this;
	this.updateServers(function() {
		var server = self.getServer(data.response.name);

	console.log(server)

	if(server === null)
	{
		db.models.Server.forge({ 
			name: data.response.name,
			address: data.response.address,
			nick: data.response.nick,
			autojoin: data.response.autojoin,
			user_id: self.id
		})
		.save()
		.then(function(srv) {
			var sId = srv.get('id') + '_' + srv.get('name') + '_' + self.id;
			config.ircServers[sId] = new irc.Client(srv.get('address'), srv.get('nick'), {
				port: 6667,
				channels: ['#test'], // TODO
				realName: 'test#test',
				userName: 'test#test',
				autoConnect: Boolean(+srv.get('autojoin'))
			});

			if(!Boolean(+srv.get('autojoin')))
				config.ircServers[sId].connect();
			try
			{
				self.socket.send(helper.socketData('irc.added', { name: srv.get('name') }));
			}
			catch(e)
			{
				config.logger.error('Socket not opened');
			}

			self.updateServers();
		});
	}
	else
	{
		var sId = server.get('id') + '_' + server.get('name') + '_' + selfn.id;

		if(typeof config.ircServers[sId].nick == 'undefined')
		{
			config.ircServers[sId].connect();
		}
		try {
			self.socket.send(helper.socketData('irc.connected', { name: server.get('name') }));
		} catch(e) {}
	}

	});
};

User.prototype.disconnect = function(data)
{
	var server = this.getServer(data.response.name);
	if(this.isServerConnected( server.get('id'), server.get('name'), this.id ))
		this.getIrcServer( server.get('id'), server.get('name'), this.id ).disconnect('leaving...');
};

User.prototype.join = function(data)
{
	var server = this.getServer(data.response.name);
	var ircServer = this.getIrcServer(server.get('id'), server.get('name'), this.id);

	if(typeof ircServer.chans[data.response.channel] == 'undefined')
		ircServer.join(data.response.channel);

	db.models.Channel.forge({
		name: data.response.channel,
		server_id: server.get('id')
	})
	.fetch()
	.then(function(channel) {
		if(channel == null)
		{
			db.models.Channel.forge({
				name: data.response.channel,
				server_id: server.get('id')
			})
			.save();
		}
	});
};

User.prototype.part = function(data)
{
	var server = this.getServer(data.response.name);
	var ircServer = this.getIrcServer(server.get('id'), server.get('name'), this.id);

	if(typeof ircServer.chans[data.response.channel] !== 'undefined')
		ircServer.part(data.response.channel);

	db.models.Channel.forge({
		name: data.response.channel,
		server_id: server.get('id')
	})
	.fetch()
	.then(function(channel) {
		if(channel !== null)
		{
			channel.destroy();
		}
	});
};

User.prototype.say = function(data)
{
	var server = this.getServer(data.response.name);
	var ircServer = this.getIrcServer(server.get('id'), server.get('name'), this.id);

	ircServer.say(data.response.target, data.response.message);

	config.events.emit('irc.' + server.get('id') + '_' + server.get('name') + '_' + this.id + '.message', {
		server: data.response.name,
		from: server.get('nick'),
		to: data.response.target,
		message: data.response.message
	});
};

User.prototype.servers = function()
{
	var dbServers = this.model.related('servers');
	var servers = [];

	dbServers.each(function(server) {
		servers.push(server.get('name'));
	});

	try {
		this.socket.send( helper.socketData('irc.servers', servers) );
	} catch(e) {}
};

User.prototype.channels = function(serverName)
{
	var self = this;
	var channels = [];
	var server = this.getServer(serverName);

	var dbChannels = server.related('channels').fetch()
	.then(function(_channels) {
		_channels.each(function(channel) {
			channels.push({ 
				channel: channel.get('name'),
				nick: server.get('nick')
			});
		});

		try {
			self.socket.send( helper.socketData('irc.channels', { serverName: serverName, channels: channels }) );
		} catch(e) {}
	});
};

User.prototype.names = function(data)
{
	var server = this.getServer(data.response.name);
	var ircServer = this.getIrcServer(server.get('id'), server.get('name'), this.id);
	
	if(this.isServerConnected(server.get('id'), server.get('name'), this.id))
		ircServer.send('NAMES', data.response.channel);
};

User.prototype.getServer = function(name, cb)
{
	// var servers = this.model.related('servers');
	var server = null;

	this.dbServers.each(function(server_) {
		if(server_.get('name') === name)
			server = server_;
	});
	return server;
};

User.prototype.getIrcServer = function(id, name, uid)
{
	var sId = id + '_' + name + '_' + uid;
	return config.ircServers[sId];
};

User.prototype.isServerConnected = function(id, name, uid)
{
	var connected = false;
	var sId = id + '_' + name + '_' + uid;
	if(typeof config.ircServers[sId].nick !== 'undefined')
		connected = true;

	return connected;
}

User.prototype.getChannel = function(server, channel)
{

};

User.prototype.addModel = function(model)
{
	this.model = model;
	this.initServers();
};

User.prototype.onConnect = function()
{
	var self = this;
	this.servers();
	this.model.related('servers').each(function(server) {
		self.channels(server.get('name'));
		// self.names({ response: { name: server.get('name') } });
	});
};

module.exports = User;