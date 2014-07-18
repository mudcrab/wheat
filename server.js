var db = require('./db.js');
var config = require('./config.js');
var irc = require('irc');

(function() {
	var Server = function(server, cb)
	{
		this.model = server;
		this.channels = [];
		this.irc = null;

		var self = this;
		var channelNames = [];

		this.model.related('channels').fetch()
		.then(function(channels_) {
			channels_.forEach(function(channel) {
				channelNames.push(channel.get('name'));
				self.channels.push(channel);
			});
		}).then(function() {
			new irc.Client();
			self.irc = new irc.Client(self.model.get('address'), self.model.get('nick'), {
				channels: channelNames,
				realName: 'test#test',
				userName: 'test#test'
			});

			cb();
		});

	};

	Server.prototype.joinChannel = function(channelName)
	{
		var self = this;

		if(!this.getChannel(channelName))
		{
			new db.models.Channel({ name: channelName, server_id: self.model.get('id')}).save()
			.then(function(channelModel) {
				self.irc.join(channelName);
				self.channels.push(channelModel);
			});
		}
	};

	Server.prototype.getChannel = function(channelName)
	{
		var channel = false;

		this.channels.forEach(function(chan) {
			if(chan.get('name') === channelName)
				channel = chan;
		});

		return channel;
	};

	Server.prototype.removeChannel = function(channelName)
	{
		var self = this;
		this.channels.forEach(function(channel, i) {
			if(channel.get('name') === channelName)
			{
				self.channels.splice(i, 1);
			}
		});
	};

	Server.prototype.say = function(channelName, message)
	{
		if(this.getChannel(channelName))
		{
			this.irc.say(channelName, message);
		}
	};

	Server.prototype.getLog = function(channelName, lines, cb)
	{
		var self = this;
		if(this.getChannel(channelName))
		{

			db.connection.knex('logs')
			.join('messages', 'messages.id', '=', 'logs.message_id')
			.where('logs.channel_id', function() {
				this.select('id').from('channels').where({ name: channelName, server_id: self.model.get('id') });
			})
			.limit(lines)
			.select('messages.from', 'messages.message', 'messages.date').then(function(data) {
				if(typeof cb == 'function')
					cb(data);
			});

		}
	};

	Server.prototype.disconnect = function()
	{
		this.irc.disconnect();
	};

	module.exports = Server;
})();