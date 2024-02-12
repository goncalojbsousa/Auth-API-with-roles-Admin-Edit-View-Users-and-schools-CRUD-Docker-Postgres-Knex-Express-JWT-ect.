// migrations/xxxx_create_escolas.js
exports.up = function (knex) {
    return knex.schema.createTable('escolas', function (table) {
      table.increments('id').primary();
      table.string('nome');
      table.string('responsavel');
      table.string('contacto');
      table.string('morada');
      table.int('user_id');
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable('escolas');
  };