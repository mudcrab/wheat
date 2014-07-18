/*
	Tests for socket server endpoints.
	Will get refactored at some point.
*/

var should = require('should');
var WebSocket = require('ws');
var wheat = require('../wheat.js');
var config = require('../config.js');
var E = require('minivents');
var Events = new E();
var port = config.app.ports[process.env.NODE_ENV] || 1337;
var wsAddress = 'ws://localhost:' + port;
var Log = require('../log.js');
var Logger = new Log('log/test.log', { echo: false, timestamp: true });

function setData(type, data)
{
	return JSON.stringify({ type: type, data: data });
};

function closeConnections(cb)
{
	setTimeout(function() {
		wheat.stop();
		cb();
	}, 1000);
};

describe('Socket client', function() {
	var client;
	var serverlist;

	before(function(done) {
		client = new WebSocket(wsAddress);
		client.on('open', function() {
			client.send(setData('auth', { username: 'jk', password: 'asdf1234' }));

			client.on('message', function(data) {
				var message = JSON.parse(data);
				Events.emit(message.type, message.data);
			});
			done();
		});
	});

	after(function(done) {
		client.close();
		done();
	});

	it('should authenticate user', function(done) {
		Events.on('auth', function(data) {
			data.status.should.equal('authenticated');
			Events.off('auth');
			done();
		});
	});

	it('should connect to (or add) an irc server', function(done) {
		var serverData = {
			name: 'local2',
			address: 'localhost',
			nick: 'jkk',
			autojoin: true,
		};

		client.send(setData( 'irc.connect', serverData ));

		Events.on('connectServer', function(data) {
			data.status.should.equal('connected');
			Events.off('connectServer');
			done();
		});
	});

	it('should get a list of servers', function(done) {
		client.send(setData('irc.servers', {}));

		Events.on('servers', function(data) {
			data.servers.should.be.an.Object;
			serverlist = data.servers;
			done();
		});
	});

	it('should disconnect from an irc server', function(done) {
		client.send(setData('irc.disconnect', { name: serverlist[0].name }))
		serverlist.shift();

		Events.on('disconnectServer', function(data) {
			data.status.should.be.true;
			client.send(setData('server.stop', {}));
			done();
		});
	});

	it('should join a channel');
	it('should change the nickname');
	it('should part the channel');
	it('should disconnect from the irc server');
	it('should send a chat message to channel');
	it('should send a chat message to another user');
});