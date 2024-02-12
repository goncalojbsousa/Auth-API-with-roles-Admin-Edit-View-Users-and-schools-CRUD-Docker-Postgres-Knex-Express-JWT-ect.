const express = require('express');
const bodyParser = require('body-parser');
const knex = require('knex');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { isEmail } = require('validator');

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

const db = knex(require('./knexfile'));

// middleware de autorização
const authorizeUser = (rules) => {
  return (req, res, next) => {
    if (!rules.includes(req.user.rule)) {
      return res.status(403).json({ message: 'Acesso proibido' });
    }
    next();
  };
};

//middleware de autenticação
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Token de autenticação não fornecido' });
  }

  console.log("Token recebido: ", token);

  jwt.verify(token, "secret", (err, decodedToken) => {
    if (err) {
      console.error("Erro ao verificar o token:", err);
      return res.status(401).json({ message: 'Token de autenticação inválido', token: token });
    }

    console.log("Token decodificado:", decodedToken);

    // verifica se o token tem o userid
    if (!decodedToken.userId) {
      return res.status(401).json({ message: 'Token de autenticação inválido - ID do utilizador não encontrado' });
    }

    // atribui o id e a rule ao utilizador
    req.user = {
      id: decodedToken.userId,
      rule: decodedToken.rule
    };

    console.log("Id do user: ", decodedToken.userId);
    console.log("Rule do user: ", decodedToken.rule);

    next();
  });
};

/**
 *  ENDPOINTS DE AUTENTICAÇÃO
 * **/

// rota de registro
app.post('/register', async (req, res) => {
  const { user, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // verifica se o email é valido com o validator
    if (!isEmail(email)) {
      return res.status(400).json({ message: 'Por favor, insira um email válido' });
    }

    // verifica se o email ja existe na base de dados
    const existingUser = await db('users').where('email', email).first();
    if (existingUser) {
      return res.status(400).json({ message: 'Este email já está registrado' });
    }

    await db('users').insert({ user, email, password: hashedPassword });
    res.status(201).json({ message: 'Utilizador registrado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao registrar utilizador', error: error.message });
  }
});

// rota de login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log("jwt: ", process.env.JWT_SECRET)
  try {
    const user = await db('users').where({ email }).first();

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const tokenPayload = {
      userId: user.id,
      rule: user.rule 
    };

    const token = jwt.sign(tokenPayload, "secret", { expiresIn: '1h' });

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
});

/**
 *  ENDPOINTS DO USER
 * **/

// rota para editar o user, apenas o admin pode editar a role
app.put('/user/editar/:id', authenticateUser, authorizeUser(['admin', 'edit', 'view']), async (req, res) => {
  const userId = req.params.id;
  const { user, password, rule } = req.body;
  const loggedInUserId = req.user.id;
  const loggedInUserRule = req.user.rule;

  try {
    // busca os dados do user
    const existingUser = await db('users').where({ id: userId }).first();
    if (!existingUser) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    // Somente o admin pode editar a role do usuário
    if (loggedInUserRule !== 'admin') {
      delete req.body.rule; // Remove a tentativa de edição da regra se o usuário não for admin
    }

    // Verifica se o usuário tem permissão para editar o usuário
    if (userId !== loggedInUserId.toString() && loggedInUserRule !== 'admin') {
      return res.status(403).json({ error: 'Acesso proibido' });
    }

    // Atualiza o nome do user apenas se for fornecido
    if (user) existingUser.user = user;

    // Encripta a senha com o bcrypt
    if (password) {
      existingUser.password = await bcrypt.hash(password, 10);
    }

    // Atualiza a role do usuário apenas se o usuário for admin
    if (rule && loggedInUserRule === 'admin') {
      existingUser.rule = rule;
    }

    // Atualiza a base de dados
    await db('users').where({ id: userId }).update(existingUser);

    res.status(200).json({ message: 'Dados do utilizador atualizados com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao atualizar dados do utilizador', error: error.message });
  }
});


// rota para eliminar utilizadores
app.delete('/users/eliminar/:id', authenticateUser, authorizeUser(['admin', 'edit', 'view']), async (req, res) => {
  const userIdToDelete = req.params.id;
  const loggedInUserId = req.user.id;
  const loggedInUserRule = req.user.rule;

  try {
    // verifica se o user existe
    const existingUser = await db('users').where({ id: userIdToDelete }).first();
    if (!existingUser) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    // verifica se quem está a editar é o user logado ou admin
    if (userIdToDelete !== loggedInUserId.toString() && loggedInUserRule !== 'admin') {
      return res.status(403).json({ error: 'Acesso proibido' });
    }

    // elimina o utilizador da base de dados
    await db('users').where({ id: userIdToDelete }).del();

    res.status(200).json({ message: 'Utilizador eliminado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao eliminar utilizador', error: error.message });
  }
});

app.get('/users', authenticateUser, authorizeUser(['admin']), async (req, res) => {
  try {
    const users = await db('users').select('id', 'user', 'email');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao obter informações dos utilizadores', error: error.message });
  }
});

/**
 *  ENDPOINTS DA ESCOLA
 * **/

app.post('/escolas/adicionar', authenticateUser, authorizeUser(['admin', 'edit']), async (req, res) => {
  const { nome, responsavel, contacto, morada } = req.body;
  const userId = req.user.id;

  try {
    // guarda os dados na base de dados
    const escolaId = await db('escolas').insert({
      nome,
      responsavel,
      contacto,
      morada,
      user_id: userId
    });

    res.status(201).json({ message: 'Escola adicionada com sucesso', escolaId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao adicionar escola', error: error.message });
  }
});

// rota para editar escola
app.put('/escolas/editar/:id', authenticateUser, authorizeUser(['admin', 'edit']), async (req, res) => {
  const escolaId = req.params.id;
  const userId = req.user.id;
  const { nome, responsavel, contacto, morada } = req.body;

  try {
    // verifica se a escola existe
    const existingEscola = await db('escolas').where({ id: escolaId }).first();
    if (!existingEscola) {
      return res.status(404).json({ error: 'Escola não encontrada' });
    }

    // verifica se o user é admin/dono da escola
    if (userId !== existingEscola.user_id && req.user.rule !== 'admin') {
      return res.status(403).json({ error: 'Acesso proibido' });
    }

    // atualiza na base de dados
    await db('escolas').where({ id: escolaId }).update({
      nome,
      responsavel,
      contacto,
      morada
    });

    res.status(200).json({ message: 'Informações da escola atualizadas com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao atualizar informações da escola', error: error.message });
  }
});

// rota para eliminar escolas
app.delete('/escolas/eliminar/:id', authenticateUser, authorizeUser(['admin', 'edit']), async (req, res) => {
  const escolaId = req.params.id;
  const userId = req.user.id;

  try {
    // verifica se a escola existe
    const existingEscola = await db('escolas').where({ id: escolaId }).first();
    if (!existingEscola) {
      return res.status(404).json({ error: 'Escola não encontrada' });
    }

    // verifica se o user é admin/dono da escola
    if (req.user.rule !== 'admin' && existingEscola.user_id !== userId) {
      return res.status(403).json({ error: 'Acesso proibido' });
    }

    // elimina da base de dados
    await db('escolas').where({ id: escolaId }).del();

    res.status(200).json({ message: 'Escola eliminada com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao eliminar escola', error: error.message });
  }
});

app.get('/escolas', async (req, res) => {
  try {
    const escolas = await db('escolas').select('id', 'nome', 'responsavel', 'contacto', 'morada');
    res.json(escolas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao obter informações das escolas', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});