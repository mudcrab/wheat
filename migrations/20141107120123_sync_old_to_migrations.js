'use strict';

exports.up = function(knex, Promise) {
	return Promise.all([
		knex.schema.createTable('users', function(table) {
			table.increments('id').primary().unsigned();
			table.string('email', 255);
			table.string('password', 255);
		}),

		knex.schema.createTable('servers', function(table) {
			table.increments('id').primary().unsigned();
			table.string('name', 255);
			table.string('address', 255);
			table.string('nick', 255);
			table.boolean('autojoin');
			table.integer('user_id').unsigned().index().references('id').inTable('users');
		}),

		knex.schema.createTable('channels', function(table) {
			table.increments('id').primary().unsigned();
			table.string('name', 255);
			table.integer('server_id').unsigned().index().references('id').inTable('servers');
		})
	]);
};

exports.down = function(knex, Promise) {
	return Promise.all([
		knex.schema.dropTable('channels'),
		knex.schema.dropTable('servers'),
		knex.schema.dropTable('users')
	]);
};
