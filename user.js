/*
	User module (model?) handles IRC, db, etc connections for the user
*/

var db = require('./db.js');
var config = require('./config.js');
var irc = require('irc');
var Server = require('./server.js');

(function() {

	var User = function(model)
	{
		this.model = model;
		this.sockets = [];
		this.servers = {};
		this.ircConnections = [];
		this.dbChannels = [];

		this.init();
	};

	User.prototype.init = function()
	{
		var self = this;
		this.model.related('servers').fetch()
		.then(function(servers) {
			servers.forEach(function(server) {
				self.servers[server.get('name')] = new Server(server, function() {
					self.initServer(server);
				});
			});
		});
		/*db.models.User.forge({ id: this.userInfo.id }).fetch().then(function(user) {
			user.related('servers').fetch().then(function(servers) {
				servers.forEach(function(server) {
					self.loadServer(server);
				});
			});
		});*/
	};

	User.prototype.initServer = function(server)
	{
		var self = this;
		
		this.servers[server.get('name')].irc.addListener('registered', function(_data) {
			config.events.emit('irc.connected', { server: { name: server.get('name'), data: _data }, users: self.sockets });
		});

		this.servers[server.get('name')].irc.addListener('raw', function(raw) {
			// 
		});

		this.servers[server.get('name')].irc.addListener('join', function(channel, nick) {
			config.events.emit('irc.join', { channel: channel, nick: nick });
		});

		this.servers[server.get('name')].irc.addListener('error', function(message) {
			console.log(message);
		});

		this.servers[server.get('name')].irc.addListener('message', function(f, t, m) {
			var mData = {
				from: f,
				to: t,
				message: m,
				server: self.model.get('name')
			};
			self.updateLog.call(self, self.model.get('name'), mData);
			config.events.emit('irc.say', {
				server: server.get('name'),
				users: self.sockets,
				data: mData
			});
		});
		
	};

	User.prototype.authenticate = function(socket)
	{
		this.sockets.push(socket);
	};

	User.prototype.getIrc = function(serverName)
	{
		var server = this.servers[serverName];
		if(typeof server == 'undefined')
			return false;
		else
			return server.irc;
	};

	/*
		joins the channel and adds an entry to the database for future autojoin
	*/

	User.prototype.joinChannel = function(serverName, channelName)
	{
		this.getServer(serverName).joinChannel(channelName);
	};

	/*
		parts the channel and removes the entry from the database
	*/

	User.prototype.partChannel = function(serverName, channel)
	{
		// todo
	};

	User.prototype.getServersLog = function()
	{
		var log = {};
		for(var server in this.servers)
		{
			var srv = this.getServer(server);
			log[server] = [];
			srv.channels.forEach(function(channel) {
				srv.getLog(channel.get('name'), 100, function(history) {
					log[server].push({
						name: channel.get('name'),
						message: 'none',
						history: history
					});
				});
			});
		}
		return log;
	};

	User.prototype.updateLog = function(serverName, messageData)
	{
		var channel = {};
		var server_ = null;
		var message = null;

		this.dbServers.forEach(function(server) {
			if(server.get('name') === serverName)
				server_ = server.get('id');
		});

		this.dbChannels.forEach(function(chan) {
			if(chan.get('name') === messageData.to && server_ == chan.get('server_id'))
				channel = chan;
		});

		var msg = new db.models.Messages({
			from: messageData.from,
			message: messageData.message
		}).fetch().then(function(m) {
			if(m)
			{
				new db.models.Log({
					channel_id: channel.get('id'),
					message_id: m.get('id')
				}).save();
			}
			else
			{
				new db.models.Messages({
					from: messageData.from,
					message: messageData.message,
					date: '2014-04-27 12:00:00'
				}).save().then(function(m) {
					new db.models.Log({
						channel_id: channel.get('id'),
						message_id: m.get('id')
					}).save();
				});
			}
		});
	};

	User.prototype.getLog = function(serverName, channelName, lines, cb)
	{
		db.models.Server.forge({ user_id: this.userInfo.id, name: serverName }).fetch().then(function(server) {
			
			db.connection.knex('logs')
			.join('messages', 'messages.id', '=', 'logs.message_id')
			.where('logs.channel_id', function() {
				this.select('id').from('channels').where({ name: channelName, server_id: server.get('id') });
			})
			.limit(lines)
			.select('messages.from', 'messages.message', 'messages.date').then(function(data) {
				if(typeof cb == 'function')
					cb(data);
			});

		});
	};

	/*
		Get the server from dbServers array

		@return server model || false
	*/

	User.prototype.getServer = function(serverName)
	{
		return this.servers[serverName] || false;
	};

	/*
		Get the channel from dbChannels array

		@return channel model || false
	*/

	User.prototype.getChannel = function(channelName, serverName)
	{
		return this.servers[serverName].getChannel(channelName);
	};

	User.prototype.addSocket = function(socket)
	{
		console.log('Adding socket for %s', this.model.get('email'));
		this.sockets.push(socket);
	};

	User.prototype.removeSocket = function(socket)
	{
		var self = this;
		this.sockets.forEach(function(_socket, i) {
			if(_socket == socket)
			{
				console.log('Removing socket for "%s"', self.username);
				self.sockets.splice(i, 1);
			}
		});
	};

	User.prototype.sendMessage = function(serverName, channelName, message)
	{
		var self = this;

		var server = this.getServer(serverName);

		if(server)
		{

			server.say(channelName, message);

			config.events.emit('irc.say', {
				server: serverName,
				users: self.sockets,
				data: {
					from: server.model.get('nick'),
					to: channelName,
					message: message,
					server: serverName
				}
			});
		}
	};

	module.exports = User;

})();