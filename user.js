var config = require('./config.js');
var users = require('./users.js');
var irc = require('irc');
var db = require('./db.js');
var helper = require('./helpers/socket_helper.js')

var User = function(id, email, socket)
{
	this.id = id;
	this.email = email;
	this.socket = socket;
	this.sId = this.id + '_' + this.email;

	config.events.on('socket.' + this.sId + '.irc.connect', this.connect, this);
	config.events.on('socket.' + this.sId + '.irc.disconnect', this.disconnect, this);
	config.events.on('socket.' + this.sId + '.irc.join', this.join, this);
	config.events.on('socket.' + this.sId + '.irc.part', this.part, this);
	config.events.on('socket.' + this.sId + '.irc.say', this.say, this);
	config.events.on('socket.' + this.sId + '.irc.servers', this.servers, this);
	config.events.on('socket.' + this.sId + '.irc.channels', this.channels, this);
	config.events.on('socket.' + this.sId + '.irc.names', this.names, this);
};

User.prototype.initServers = function()
{
	var self = this;
	this.model.related('servers').each(function(server) {
		self.addIrcListeners(server.get('id'), server.get('name'), self.id);
	});
};

User.prototype.addIrcListeners = function(id, name, uid)
{
	var self = this;
	var sId = id + '_' + name + '_' + uid;

	config.events.on('irc.' + sId + '.registered', function(data) {
		self.socket.send(helper.socketData('irc.registered', { status: true, server: name }));
	});

	config.events.on('irc.' + sId + '.join', function(data) {
		self.socket.send(helper.socketData('irc.joined', { status: true, server: name, channel: data.channel, nick: data.nick }));
	});

	config.events.on('irc.' + sId + '.error', function(data) {
		config.logger.error('IRC error for uid %d on %s connection', uid, name);
		config.logger.error(data);
	});

	config.events.on('irc.' + sId + '.message', function(data) {
		self.socket.send(helper.socketData('irc.message', {
			server: name,
			from: data.from,
			to: data.to,
			message: data.message
		}));
	});

	config.events.on('irc.' + sId + '.names', function(data) {
		self.socket.send(helper.socketData('irc.names', data));
	});

	config.events.on('irc.' + sId + '.topic', function(data) {
		self.socket.send(helper.socketData('irc.topic', data));
	});

	config.events.on('irc.' + sId + '.part', function(data) {
		self.socket.send(helper.socketData('irc.part', data));
	});

	config.events.on('irc.' + sId + '.quit', function(data) {
		self.socket.send(helper.socketData('irc.quit', data));
	});

	config.events.on('irc.' + sId + '.kick', function(data) {
		self.socket.send(helper.socketData('irc.kick', data));
	});

	config.events.on('irc.' + sId + '.pm', function(data) {
		self.socket.send(helper.socketData('irc.pm', data));
	});

	config.events.on('irc.' + sId + '.nick', function(data) {
		self.socket.send(helper.socketData('irc.nick', data));
	});
};

User.prototype.connect = function(data)
{
	var self = this;
	var server = this.getServer(data.response.name);

	if(server === null)
	{
		db.models.Server.forge({ 
			name: data.response.name,
			address: data.response.address,
			nick: data.response.nick,
			autojoin: data.response.autojoin,
			user_id: this.id
		})
		.save()
		.then(function(srv) {
			var sid = srv.get('id') + '_' + srv.get('name') + '_' + self.id;
			config.ircServers[sId] = new irc.Client(srv.get('address'), srv.get('nick'), {
				channels: ['#test'], // TODO
				realName: 'test#test',
				userName: 'test#test',
				autoConnect: Boolean(+srv.get('autojoin'))
			});

			if(!Boolean(+srv.get('autojoin')))
				config.ircServers[sId].connect();
		});
	}
	else
	{
		var sId = server.get('id') + '_' + server.get('name') + '_' + this.id;

		if(typeof config.ircServers[sId].nick == 'undefined')
			config.ircServers[sId].connect();
	}
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
};

User.prototype.part = function(data)
{
	var server = this.getServer(data.response.name);
	var ircServer = this.getIrcServer(server.get('id'), server.get('name'), this.id);

	if(typeof ircServer.chans[data.response.channel] == 'undefined')
		ircServer.part(data.response.channel);
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

	this.socket.send( helper.socketData('irc.servers', servers) );
};

User.prototype.channels = function(server)
{
	var channels = [];

	var dbChannels = this.getServer(server).related('channels').each(function(channel) {
		channels.push(channel.get('name'));
	});

	this.socket.send( helper.socketData('irc.channels', channels) );
};

User.prototype.names = function(data)
{
	var server = this.getServer(data.response.name);
	var ircServer = this.getIrcServer(server.get('id'), server.get('name'), this.id);


};

User.prototype.getServer = function(name)
{
	var servers = this.model.related('servers');
	var server = null;

	servers.each(function(server_) {
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

module.exports = User;