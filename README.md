### Introdução ###

Trabalho feito para a disciplina de Serviços Distribuidos. Sistema de autenticação com crud de escolas e users. API documentada em swagger.

Os utilizadores tem 3 niveis de cargos:
Admin: Pode gerir qualquer conta. Pode criar, editar e eliminar qualquer utilizador. Pode criar, editar e eliminar qualquer escola. Pode ver lista de utilizadores e escolas.
Edit: Pode gerir a propria conta. Pode criar escolas. Pode editar e eliminar as suas escolas. Pode ver lista de escolas.
View: Pode gerir a propria conta. Pode ver lista de escolas.

### Tecnologias utilizadas ###

Docker
Knex
Express
Postgres
Cors
Validator
JsonWebToken
Bcrypt

### Como testar? ###

Terminal 1:
    cd C:\Users\zouker\Documents\GitHub\Trabalho_SD\sd
    docker compose up --build

Terminal 2:
    cd C:\Users\zouker\Documents\GitHub\Trabalho_SD\sd\src\auth-api
    npm i bcrypt cors knex express jsonwebtoken pg validator
    node index.js

Para criar as tabelas na base de dados:
    npx knex migrate:latest

Para criar a base de dados padrão: 
    npx knex seed:run