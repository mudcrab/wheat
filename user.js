/*
	User module (model?) handles IRC, db, etc connections for the user
*/

var db = require('./db.js');
var config = require('./config.js');
var irc = require('irc');

(function() {

	var User = function(id, email, password)
	{
		this.userInfo = { id: id, email: email, password: password };
		this.sockets = [];
		this.servers = {};
		this.dbChannels = [];
		this.dbServers = [];

		this.init();
	};

	User.prototype.init = function()
	{
		var self = this;
		db.models.User.forge({ id: this.userInfo.id }).fetch().then(function(user) {
			user.related('servers').fetch().then(function(servers) {
				servers.forEach(function(server) {
					self.loadServer(server);
				});
			});
		});
	};

	User.prototype.loadServer = function(server)
	{
		var self = this;
		var channels = [];

		this.dbServers.push(server);
		server.related('channels').fetch()
		.then(function(channels_) {
			channels_.forEach(function(channel) {
				channels.push(channel.get('name'));
				self.dbChannels.push(channel);
			});
		}).then(function() {
			self.servers[server.get('name')] = new irc.Client(server.get('address'), server.get('nick'), {
				channels: channels,
				realName: 'test#test',
				userName: 'test#test'
			});

			self.servers[server.get('name')].addListener('registered', function(_data) {
				config.events.emit('irc.connected', { server: { name: server.get('name'), data: _data }, users: self.sockets });
			});

			self.servers[server.get('name')].addListener('raw', function(raw) {
				// 
			});

			self.servers[server.get('name')].addListener('join', function(channel, nick) {
				config.events.emit('irc.join', { channel: channel, nick: nick });
			});

			self.servers[server.get('name')].addListener('error', function(message) {
				console.log(message);
			});

			self.servers[server.get('name')].addListener('message', function(f, t, m) {
				var mData = {
					from: f,
					to: t,
					message: m,
					server: server.get('name')
				};
				self.updateLog.call(self, server.get('name'), mData);
				config.events.emit('irc.say', {
					server: server.get('name'),
					users: self.sockets,
					data: mData
				});
			});

			self.getLog('a', 'b');
		});
	};

	User.prototype.authenticate = function(socket)
	{
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

	User.prototype.getIrc = function(serverName)
	{
		var server = this.servers[serverName];
		if(typeof server == 'undefined')
			return false;
		else
			return server;
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

	User.prototype.getLog = function(serverName, channelName, lines)
	{
		var messages = [];
		db.models.Channel.forge({ id: 1}).fetch().then(function(channel) {
			channel.related('logs').fetch().then(function(logs) {
				logs.forEach(function(log) {
					db.models.Messages.forge({ id: log.get('message_id') }).fetch().then(function(m) {
						
					});
				});
			});
		});
	};

	module.exports = User;

})();