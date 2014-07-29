var config = {
	db: {
		server: 'localhost',
		username: 'multigrain',
		password: 'multigrain',
		db: 'multigrain',
		connection: null,
		models: {}
	},
	server: null,
	events: null,
	logger: null,
	clients: {},
	ircServers: {},
	env: 'development',
	app: {
		ports: {
			production: 3000,
			development: 1337,
			test: 1338
		}
	},
	timezone: 'Europe/Tallinn'
};

module.exports = config;