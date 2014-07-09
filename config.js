var config = {
	db: {
		server: 'localhost',
		username: 'multigrain',
		password: 'multigrain',
		db: 'multigrain',
		connection: null,
		models: {}
	},
	events: null,
	app: {
		ports: {
			production: 3000,
			development: 1337,
			test: 1338
		}
	}
};

module.exports = config;