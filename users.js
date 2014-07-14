/*
	Users module, handles connected users
*/

var db = require('./db.js');

(function() {

	var User = require('./user.js');
	var config = require('./config.js');
	var util = require('util');
	var Bookshelf  = require('bookshelf').DB;


	var UsersManager = function()
	{
		this.users = [];		

		this.loadUsers();
	};

	UsersManager.prototype.loadUsers = function()
	{
		var self = this;

		/*new db.models.User({ email: 'blah@lol.com', password: 'lel' }).save().then(function(user) {
			// console.log(user);
		})*/

		db.models.User.collection().fetch().then(function(users) {
			// console.log('loading %d user(s)', users.length)
			users.forEach(function(user) {
				self.loadUser(user);
			})
		})

		/*new db.models.User().fetch().then(function(users) {
			// console.log(users)
		})*/

		/*new db.models.User({ id: 1}).related('servers').fetch().then(function(data) {
			data.models.forEach(function(model) {
				model.related('channels').fetch().then(function(channels) {
					channels.models.forEach(function(channel) {
						// console.log('%s => %s', model.get('name'), channel.get('name'))
					});
				});
			});
		});*/

	};

	UsersManager.prototype.loadUser = function(user)
	{
		this.users.push(new User(user));
	};

	UsersManager.prototype.authenticate = function(username, password)
	{

	};

	UsersManager.prototype.findUser = function(username, password, socket)
	{
		var u = false;
		this.users.forEach(function(user) {
			if(user.model.get('email') === username && user.model.get('password') === password)
			{
				u = user;
				user.addSocket(socket);
			}
		});
		return u;
	};

	UsersManager.prototype.findUserBySocket = function(socket)
	{
		var self = this;
		var user = false;

		this.users.forEach(function(user_) {
			user_.sockets.forEach(function(socket_) {
				if(socket_ === socket)
					user = user_;
			});
		});

		return user;
	};

	UsersManager.prototype.removeSocket = function(socket)
	{
		var self = this;
		this.users.forEach(function(user) {
			user.removeSocket(socket);
		});
	};

	module.exports = UsersManager;

})();