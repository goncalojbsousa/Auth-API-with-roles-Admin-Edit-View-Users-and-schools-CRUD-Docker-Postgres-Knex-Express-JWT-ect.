module.exports = {
        client: 'pg',
        connection: {
            host: 'localhost',
            port: 15432,
            user: 'sd',
            password: 'sd',
            database: 'sd'
        },
        migrations: {
            tableName: 'knex_migrations',
            directory: './migrations'
        },
        seeds: {
            directory: './seeds'
          }
};