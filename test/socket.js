var should = require('should');
var WebSocket = require('ws');
var wheat = require('../wheat.js');
var config = require('../config.js');
var E = require('minivents');
var Events = new E();
var port = config.app.ports[process.env.NODE_ENV] || 1337;

function setData(type, data)
{
	return JSON.stringify({ type: type, data: data });
};

function handleMessage(data)
{
	var msg = JSON.parse(data);
	Events.emit(msg.type, msg.data);
};

function closeConnections()
{
	setTimeout(function() {
		wheat.wss_.close();
		wheat.db_.connection.knex.destroy();
	}, 1000);
};

describe('Socket client', function() {
	it('should authenticate user', function(done) {
		var client = new WebSocket('ws://localhost:' + port);

		client.on('open', function() {
			client.send(setData('auth', { username: 'jk', password: 'asdf1234' }));

			client.on('message', function(message) {
				handleMessage(message);
			});

			Events.on('auth', function(data) {
				console.log(data)
				data.status.should.equal('authenticated');
				client.close();
				closeConnections();
				done();
			});
		});
	});

	it('should join a channel');
	it('should change the nickname');
	it('should part the channel');
	it('should disconnect from the irc server');
	it('should send a chat message to channel');
	it('should send a chat message to another user');
});