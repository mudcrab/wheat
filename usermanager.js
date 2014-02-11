(function() {
	var UserManager = function()
	{
		this.users = [];
	};

	UserManager.prototype.addUser = function(user)
	{
		var self = this;

		var ret = true;
		this.users.forEach(function(_user) {
			if(_user.username == user.username)
				ret = false;
		});
		if(ret)
			self.users.push(user);
		
		return ret;
	};

	UserManager.prototype.getUser = function(username)
	{
		var user = false;
		this.users.forEach(function(_user) {
			if(_user.username == username)
			{
				user = _user;
			}
		});
		return user;
	};

	UserManager.prototype.getUserBySocket = function(socket)
	{
		var user = false;
		this.users.forEach(function(_user) {
			_user.clients.forEach(function(client) {
				if(client == socket)
				{
					user = _user;
				}
			})
		});
		return user;
	}

	UserManager.prototype.listUsers = function()
	{
		return this.users;
	}

	module.exports = UserManager;
})();

/*var user = {
	name: 'some_name',
	pw: 'some_pw',
	ircServers: {
		server_1: {}
	}
}*/