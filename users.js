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
			console.log(user);
		})*/

		db.models.User.collection().fetch().then(function(users) {
			users.forEach(function(user) {
				self.loadUser(user);
			})
		})

		/*new db.models.User().fetch().then(function(users) {
			console.log(users)
		})*/

		/*new db.models.User({ id: 1}).related('servers').fetch().then(function(data) {
			data.models.forEach(function(model) {
				model.related('channels').fetch().then(function(channels) {
					channels.models.forEach(function(channel) {
						console.log('%s => %s', model.get('name'), channel.get('name'))
					});
				});
			});
		});*/

	};

	UsersManager.prototype.loadUser = function(user)
	{
		this.users.push(new User(user.get('id'), user.get('email'), user.get('password')));
	};

	UsersManager.prototype.authenticate = function(username, password)
	{

	};

	UsersManager.prototype.getUser = function()
	{

	};

	module.exports = UsersManager;

})();