// migrations/xxxx_create_users.js
exports.up = function (knex) {
    return knex.schema.createTable('users', function (table) {
      table.increments('id').primary();
      table.string('user');
      table.string('email').notNullable();
      table.string('password').notNullable();
      table.string('rule').notNullable();
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable('users');
  };
  