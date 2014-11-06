'use strict';

exports.up = function(knex, Promise) {
  return Promise.all([
  	knex.schema.createTable('logs', function(table) {
  		table.increments('id').primary().unsigned();
  		table.string('from', 255);
  		table.string('to', 255);
  		table.dateTime('date');
  		table.integer('server_id');
  		table.integer('channel_id');
  		table.integer('user_id');
  	})
  ]);
};

exports.down = function(knex, Promise) {
  
};
