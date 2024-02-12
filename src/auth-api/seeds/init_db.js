// responsavel por guardar alguns users e escolas default na base de dados
//npx knex seed:run

const bcrypt = require('bcrypt');

exports.seed = async function(knex) {

      // limpa a tabela de escolas
      await knex('escolas').del();

      // limpa a tabela de users
      await knex('users').del();

      // encripta as passwords
      const adminPassword = await bcrypt.hash('Admin', 10);
      const editPassword = await bcrypt.hash('Edit', 10);
      const viewPassword = await bcrypt.hash('View', 10);

      // guarda os users
      await knex('users').insert([
        { id: 1, user: 'Admin', email: 'admin@gmail.com', password: adminPassword, rule: 'admin' },
        { id: 2, user: 'Edit', email: 'edit@gmail.com', password: editPassword, rule: 'edit' },
        { id: 3, user: 'View', email: 'view@gmail.com', password: viewPassword, rule: 'view' },
        { id: 4, user: 'Edit2', email: 'edit2@gmail.com', password: editPassword, rule: 'edit' }
      ]);

      // guarda as escolas
      await knex('escolas').insert([
        { id: 1, nome: 'Escola1', responsavel: 'Edit', contacto: '933333333', morada: 'Morada2', user_id: 2 },
        { id: 2, nome: 'Escola2', responsavel: 'Edit', contacto: '933333333', morada: 'Morada2', user_id: 2 },
        { id: 3, nome: 'Escola3', responsavel: 'Admin', contacto: '966666666', morada: 'Morada1', user_id: 1 },
      ]);
    };