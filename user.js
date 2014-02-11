(function() {
	var ServerManager = require('./servermanager.js');
	var User = function(username)
	{
		this.clients = [];
		this.servers = new ServerManager();
		this.username = username;
	};

	User.prototype.addServer = function(name, address, ircUser, uData)
	{
		// ircUser.socketUser = this.username;
		uData.socketUser = this.username;
		uData.username = ircUser;
		return this.servers.connect(name, address, uData);
	};

	User.prototype.getServer = function(serverName)
	{
		return this.servers.getServerConnection(serverName);
	};

	User.prototype.removeServer = function(serverName)
	{
		this.servers.disconnect(serverName);
	};

	User.prototype.addSocket = function(client)
	{
		var self = this;
		var ret = true;
		this.clients.forEach(function(_client) {
			if(_client == client)
				ret = false;
		});
		if(ret)
			self.clients.push(client);

		return ret;
	};

	User.prototype.getSockets = function()
	{
		return this.clients;
	};

	User.prototype.removeSocket = function()
	{

	};

	module.exports = User;
})();