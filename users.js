var config = require('./config.js');
var db = require('./db.js');
var irc = require('irc');
var User = require('./user.js');

var users = 
{
	// ircServers: {},

	init: function()
	{
		var self = this;

		db.models.User.forge().fetchAll()
		.then(function(usersData) {
			usersData.each(function(user) {
				user.related('servers').fetch()
				.then(function(servers) {
					self.initServers(user, servers);
				});
			});
		})
	},

	initServers: function(user, servers)
	{
		var self = this;

		servers.each(function(server) {
			var sId = server.get('id') + '_' + server.get('name') + '_' + user.get('id');
			var serverName = server.get('name');
			var channels = [];

			var dbChannels = server.related('channels').fetch()
			.then(function(dbChannels) {
				dbChannels.each(function(channel) {
					channels.push(channel.get('name'));
				});
			})
			.then(function() {
				config.ircServers[sId] = new irc.Client(server.get('address'), server.get('nick'), {
					channels: channels, // TODO
					realName: 'Name',
					userName: server.get('nick') + '_wheat',
					autoConnect: Boolean(+server.get('autojoin'))
				});

				config.ircServers[sId].addListener('raw', function(data) {
					
				});

				config.ircServers[sId].addListener('registered', function(data) {
					config.events.emit('irc.' + sId + '.registered', data);	
				});

				config.ircServers[sId].addListener('join', function(channel, nick) {
					config.events.emit('irc.' + sId + '.join', { channel: channel, nick: nick });
				});

				config.ircServers[sId].addListener('error', function(data) {
					config.events.emit('irc.' + sId + '.error', data);
				});

				config.ircServers[sId].addListener('message', function(nick, to, message) {
					config.events.emit('irc.' + sId + '.message', {
						from: nick,
						to: to,
						message: message
					});
				});

				config.ircServers[sId].addListener('names', function(channel, nicks) {
					config.events.emit('irc.' + sId + '.names', {
						channel: channel,
						nicks: nicks,
						server: serverName
					});
				});

				config.ircServers[sId].addListener('topic', function(channel, topic, nick) {
					config.events.emit('irc.' + sId + '.topic', {
						channel: channel,
						topic: topic,
						nick: nick,
						server: serverName
					});
				});

				config.ircServers[sId].addListener('part', function(channel, nick, reason) {
					config.events.emit('irc.' + sId + '.part', {
						channel: channel,
						nick: nick,
						reason: reason,
						server: serverName
					});
				});

				config.ircServers[sId].addListener('quit', function(nick, reason, channels) {
					config.events.emit('irc.' + sId + '.quit', {
						nick: nick,
						reason: reason,
						channels: channels,
						server: serverName
					});
				});

				config.ircServers[sId].addListener('kick', function(channel, nick, by, reason) {
					config.events.emit('irc.' + sId + '.kick', {
						channel: channel,
						nick: nick,
						by: by,
						reason: reason,
						server: serverName
					});
				});

				config.ircServers[sId].addListener('pm', function(nick, text) {
					config.events.emit('irc.' + sId + '.pm', {
						nick: nick,
						text: text,
						server: serverName
					});
				});

				config.ircServers[sId].addListener('nick', function(oldNick, newNick, channels) {
					config.events.emit('irc.' + sId + '.nick', {
						oldNick: oldNick,
						newNick: newNick,
						channels: channels,
						server: serverName
					});
				});

			});

		});
	},

	auth: function(email, password, cb)
	{

		db.models.User.forge({ email: email, password: password }).fetch({ withRelated: ['servers'] })
		.then(function(user) {
			cb(user);
		});

	},

	User: User
};

module.exports = users;