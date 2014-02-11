(function() {
	var irc = require('irc');
	var Events = require('minivents');
	var ServerManager = function()
	{
		this.servers = {};
		this.events = new Events();
	};

	ServerManager.prototype.connect = function(serverName, serverAddress, user)
	{
		var self = this;
		if(typeof this.servers[serverName] == 'undefined')
		{
			this.servers[serverName] = {
				socketUser: user.socketUser,
				connection: new irc.Client(serverAddress, user.username, {
					realName: user.realName,
					userName: user.userName
				})
			};

			this.servers[serverName].connection.addListener('error', function(message) {
				console.log(message);
			});

			this.servers[serverName].connection.addListener('message', function(f, t, m) {
				self.events.emit('irc.message', { 
					s: serverName, 
					u: user.socketUser, 
					data: {
						from: f,
						to: t,
						message: m
					}
				})
			});
		}
		else
			return false;
	};

	ServerManager.prototype.disconnect = function(serverName)
	{
		this.getServerConnection(serverName).disconnect();
	};

	ServerManager.prototype.join = function(serverName, channel, cb)
	{
		this.getServerConnection(serverName).join(channel, cb());
	};

	ServerManager.prototype.part = function(serverName, channel)
	{
		this.getServerConnection(serverName).part(channel);
	};

	ServerManager.prototype.getServerConnection = function(serverName)
	{
		var server = this.servers[serverName];
		if(typeof server == 'undefined')
			return false;
		else
			return server.connection;
	};

	module.exports = ServerManager
})();