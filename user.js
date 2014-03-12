(function() {
	var irc = require('irc');
	var Events = require('minivents');

	var User = function(username, password, events)
	{
		this.sockets = [];
		this.servers = {};
		this.log = {};
		this.events = events;

		this.username = username;
		this.password = password;
	};

	User.prototype.loadServer = function(server)
	{
		var self = this;
		console.log('Loading server "%s"', server.name);

		this.servers[server.name] = new irc.Client(server.addr, server.nick, {
			channels: server.channels,
			realName: server.nick, 
			userName: server.nick
		});

		self.log[server.name] = {};
		server.channels.forEach(function(channel) {
			self.log[server.name][channel] = [];
		});

		this.servers[server.name].addListener('error', function(message) {
			console.log(message);
		});

		this.servers[server.name].addListener('message', function(f, t, m) {
			var mData = {
				from: f,
				to: t,
				message: m
			};
			self.updateLog(server.name, mData);
			self.events.emit('irc.say', {
				server: server.name,
				user: self.username,
				data: mData
			});
		});
	};

	User.prototype.updateLog = function(server, data)
	{
		if(this.log[server][data.to].length == 100)
			this.log[server][data.to].shift();
		this.log[server][data.to].push(data);
	};

	User.prototype.getChannelLog = function(server, channel)
	{
		return this.log[server][channel];
	};

	User.prototype.getServerLog = function(server)
	{
		return this.log[server];
	};

	User.prototype.join = function(serverName, channel, cb)
	{
		this.getIrc(serverName).join(channel, cb());
	};

	User.prototype.send = function(serverName, channel, message)
	{
		var self = this;
		if(this.servers[serverName] != 'undefined')
		{
			this.servers[serverName].say(channel, message);
			this.events.emit('irc.say', {
				server: serverName,
				user: self.username,
				data: {
					from: self.username,
					to: channel,
					message: message
				}
			});
		}
	};

	User.prototype.authenticate = function(socket)
	{
		console.log('User %s authenticated', this.username);
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

	module.exports = User;
})();