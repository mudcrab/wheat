// Update with your config settings.
var config = require('./config.js');

module.exports = {

  development: {
    client: 'mysql',
    connection: {
      host: config.db.server,
      user: config.db.username,
      password: config.db.password,
      database: config.db.db,
      charset: 'utf8'
    }
  },

  staging: {
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
  },

  production: {
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
  }

};