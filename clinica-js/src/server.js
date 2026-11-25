require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const util = require('./util');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Sessão de 30 minutos de inatividade (igual ao guia)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'troque-por-um-segredo-longo',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 30 * 60 * 1000 },
  })
);

// Variáveis disponíveis em todas as views
app.use((req, res, next) => {
  res.locals.usuario = req.session.paciente || null;
  res.locals.flash = req.session.flash || null;
  res.locals.erro = null;
  delete req.session.flash;
  res.locals.fmtData = util.fmtData;
  res.locals.fmtDataHora = util.fmtDataHora;
  res.locals.valorData = util.valorData;
  next();
});

app.use('/', require('./routes/auth'));
app.use('/pacientes', require('./routes/pacientes'));
app.use('/medicos', require('./routes/medicos'));
app.use('/consultas', require('./routes/consultas'));

app.use((req, res) => {
  res.status(404).render('erro', { title: 'Página não encontrada', mensagem: 'Página não encontrada.' });
});

// Express 5 encaminha erros de rotas async para cá
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('erro', {
    title: 'Erro',
    mensagem: 'Ocorreu um erro inesperado. Verifique a conexão com o banco de dados e tente novamente.',
  });
});

const porta = process.env.PORT || 3000;
app.listen(porta, () => {
  console.log(`Clínica Vida & Saúde rodando em http://localhost:${porta}`);
});
