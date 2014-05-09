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

			self.getLog('local', '#test', 100, function(data) {
				console.log(data);
				self.joinChannel('local', '#asd');
			});
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

	/*
		joins the channel and adds an entry to the database for future autojoin
	*/

	User.prototype.joinChannel = function(serverName, channel)
	{
		var self = this;
		var server = this.getServer(serverName);
		
		if(!this.getChannel(channel, server.get('id')))
		{
			new db.models.Channel({ name: channel, server_id: server.get('id')}).save()
			.then(function(model) {
				self.getIrc(serverName).join(channel);
				self.dbChannels.push(model);
			});
		}
	};

	/*
		parts the channel and removes the entry from the database
	*/

	User.prototype.partChannel = function(serverName, channel)
	{

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
		var server = false;
		this.dbServers.forEach(function(_server) {
			if(_server.get('name') === serverName)
			{
				server = _server;
			}
		});
		return server;
	};

	/*
		Get the channel from dbChannels array

		@return channel model || false
	*/

	User.prototype.getChannel = function(channelName, serverId)
	{
		var channel = false;
		this.dbChannels.forEach(function(_channel) {
			if(_channel.get('name') === channelName && _channel.get('server_id') === serverId)
				channel = _channel;
		});
		return channel;
	};

	module.exports = User;

})();