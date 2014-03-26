(function() {
	var irc = require('irc');
	var Events = require('minivents');

	var User = function(username, password, events)
	{
		this.sockets = [];
		this.servers = {};
		this.log = {};
		this.events = events;

		this.username = username;
		this.password = password;
	};

	User.prototype.loadServer = function(server)
	{
		var self = this;
		console.log('Loading server "%s"', server.name);

		this.servers[server.name] = new irc.Client(server.addr, server.nick, {
			channels: server.channels,
			realName: server.nick, 
			userName: server.nick
//            debug: true
		});

		self.log[server.name] = {};
		server.channels.forEach(function(channel) {
			self.log[server.name][channel] = [];
		});

        this.servers[server.name].addListener('registered', function(_data) {
            self.events.emit('irc.connected', { server: { name: server.name, data: _data }, users: self.sockets });
        });

        this.servers[server.name].addListener('raw', function(raw) {
//            console.log(raw);
        });

        this.servers[server.name].addListener('join', function(channel, nick) {
            self.events.emit('irc.join', { channel: channel, nick: nick });
        });

		this.servers[server.name].addListener('error', function(message) {
			console.log(message);
		});

		this.servers[server.name].addListener('message', function(f, t, m) {
			var mData = {
				from: f,
				to: t,
				message: m,
                server: server.name
			};
			self.updateLog(server.name, mData);
			self.events.emit('irc.say', {
				server: server.name,
				users: self.sockets,
				data: mData
			});
		});
	};

    User.prototype.disconnect = function(serverName)
    {
        this.getIrc(serverName).disconnect();
    };

	User.prototype.joinChannel = function(serverName, channel, cb)
	{
		this.getIrc(serverName).join(channel);
		this.log[serverName][channel] = this.log[serverName][channel] || [];
	};

    User.prototype.partChannel = function(serverName, channel)
    {
        this.getIrc(serverName).part(channel);
    };

    User.prototype.setNick = function(serverName, newNick)
    {
        this.getIrc(serverName).send('NICK', newNick);
    };

    User.prototype.listNicks = function(serverName, channel)
    {
//        this.getIrc(serverName).list()
    };

	User.prototype.send = function(serverName, channel, message)
	{
		var self = this;
		if(this.servers[serverName] != 'undefined')
		{
			var mData = {
				from: self.username,
				to: channel,
				message: message,
				server: serverName
			};

			this.servers[serverName].say(channel, message);
			self.updateLog(serverName, mData);
			
			this.events.emit('irc.say', {
				server: serverName,
                users: self.sockets,
				data: mData
			});
		}
	};

	User.prototype.authenticate = function(socket)
	{
		console.log('User %s authenticated', this.username);
		this.sockets.push(socket);
	};

	User.prototype.removeSocket = function(socket)
	{
		var self = this;
		this.sockets.forEach(function(_socket, i) {
			if(_socket == socket)
			{
				console.log('Removing socket for "%s"', self.username);
				self.sockets.splice(i, 1);
			}
		});
	};

	User.prototype.getIrc = function(serverName)
	{
		var server = this.servers[serverName];
		if(typeof server == 'undefined')
			return false;
		else
			return server;
	};

    User.prototype.updateLog = function(server, data)
    {
    	this.log[server][data.to] = this.log[server][data.to] || [];

    	this.log[server][data.to].push(data);
        /*if(this.log[server][data.to].length == 100)
            this.log[server][data.to].shift();
        this.log[server][data.to].push(data);*/
    };

    User.prototype.getChannelLog = function(server, channel)
    {
        return this.log[server][channel];
    };

    User.prototype.getServerLog = function(server)
    {
        return this.log[server];
    };

    User.prototype.getServersLog = function()
    {
    	var list = {};

    	for(var server in this.log)
    	{
    		if(this.log.hasOwnProperty(server))
    		{
    			list[server] = [];

    			for(var chan in this.log[server])
    			{
    				if(this.log[server].hasOwnProperty(chan))
    				{
    					// console.log(this.log[server][chan])
    					list[server].push({
    						name: chan,
    						message: 'none',
    						history: this.log[server][chan]
    					});
    				}
    			}
    		}
    	}

    	return list;
    }

	module.exports = User;
})();