exports.up = function (knex) {
    return knex.schema.createTable('escolas', function (table) {
      table.increments('id').primary();
      table.string('nome');
      table.string('responsavel');
      table.string('contacto');
      table.string('morada');
      table.integer('user_id').unsigned(); 
      table.foreign('user_id').references('users.id'); 
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable('escolas');
  };