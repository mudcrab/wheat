'use strict';

exports.up = function(knex, Promise) {
  return Promise.all([
  	knex.schema.table('logs', function(table) {
  		table.text('message');
  	})
  ]);
};

exports.down = function(knex, Promise) {
  
};
