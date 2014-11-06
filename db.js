var Bookshelf  = require('bookshelf');
var config = require('./config.js');

(function() {

	var knex = require('knex')({
		client: 'mysql',
		connection: {
			host: config.db.server,
			user: config.db.username,
			password: config.db.password,
			database: config.db.db,
			charset: 'utf8'
		},
		migrations: {
			tableName: 'migrations'
		}
	});

	var db = {
		connection: require('bookshelf')(knex),
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
		tableName: 'logs'
	});

	db.models.Logs = db.connection.Collection.extend({
		model: db.models.Log
	});

	module.exports = db;

})();