/*
	Users module, handles connected users
*/
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

		// console.log(Bookshelf)

		var Channel = config.db.connection.Model.extend({
			tableName: 'channels'
		});

		var Server = config.db.connection.Model.extend({
			tableName: 'servers',
			channels: function()
			{
				return this.hasMany(Channel);
			}
		});

		var User = config.db.connection.Model.extend({
			tableName: 'users',
			servers: function()
			{
				return this.hasMany(Server);
			}
		})

		new User({ id: 1}).related('servers').fetch().then(function(data) {
			data.models.forEach(function(model) {
				model.related('channels').fetch().then(function(channels) {
					channels.models.forEach(function(channel) {
						console.log('%s => %s', model.get('name'), channel.get('name'))
					});
				});
			});
		});

	};

	UsersManager.prototype.loadUser = function(user)
	{
		this.users.push(new User(user.id, user.email, user.password));
	};

	UsersManager.prototype.authenticate = function(username, password)
	{

	};

	UsersManager.prototype.getUser = function()
	{

	};

	module.exports = UsersManager;

})();