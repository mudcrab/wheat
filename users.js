(function() {

	var User = require('./user.js');

	var Users = function(events)
	{
		var self = this;

		this.users = [];
		this.events = events;

		var usrs = [
			{
				id: 1,
				username: 'jk',
				password: 'asdf1234',
				servers: [
				{
					name: 'local',
					nick: 'jk',
					addr: 'localhost',
					channels: [
					'#test'
					]
				}
				]
			}
		];

		// load users
		console.log('Loading %d user(s)', usrs.length);
		usrs.forEach(function(user) {
			self.users.push(new User(user.username, user.password, self.events));

			user.servers.forEach(function(server) {
				self.getUser(user.username, user.password).loadServer(server);
			});
		});
	};

	Users.prototype.getUser = function(username, password)
	{
		var u = false;
		this.users.forEach(function(user) {
			if(user.username == username && user.password == password)
				u = user;
		});
		return u;
	};

	Users.prototype.getUserBySocket = function(socket)
	{
		var u = false;
		this.users.forEach(function(user) {
			user.sockets.forEach(function(_socket) {
				if(_socket == socket)
					u = user;
			})
		});
		return u;
	};

	Users.prototype.getAllUserSockets = function(username)
	{
		var sockets = [];
		this.users.forEach(function(user) {
			if(user.username == username)
				sockets = user.sockets;
		});

		return sockets;
	};

	Users.prototype.getAllUsers = function()
	{
		return this.users;
	};

	Users.prototype.removeSocket = function(socket)
	{
		var self = this;
		this.users.forEach(function(user) {
			user.removeSocket(socket);
		});
	};

	module.exports = Users;
})();