var Bookshelf  = require('bookshelf');
var config = require('./config.js');

(function() {

	var db = {
		connection: Bookshelf.initialize({
			client: 'mysql',
			connection: {
				host: config.db.server,
				user: config.db.username,
				password: config.db.password,
				database: config.db.db,
				charset: 'utf8'
			}
		}),
		models: {}
	};

	db.models.Channel = db.connection.Model.extend({
		tableName: 'channels',
		logs: function()
		{
			return this.hasMany(db.models.Log);
		}
	});

	db.models.Server = db.connection.Model.extend({
		tableName: 'servers',
		channels: function()
		{
			return this.hasMany(db.models.Channel);
		}
	});

	db.models.User = db.connection.Model.extend({
		tableName: 'users',
		servers: function()
		{
			return this.hasMany(db.models.Server);
		}
	});

	db.models.Log = db.connection.Model.extend({
		tableName: 'logs',
		/*channels: function()
		{
			return this.hasMany(db.models.Channel);
		},
		messages: function()
		{
			return this.hasMany(db.models.Messages);
		}*/
	});

	db.models.Messages = db.connection.Model.extend({
		tableName: 'messages',
		logs: function()
		{
			return this.hasMany(db.models.Log);
		}
	});

	db.models.Logs = db.connection.Collection.extend({
		model: db.models.Messages
	});

	module.exports = db;

})();