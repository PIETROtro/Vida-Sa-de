const router = require('express').Router();
const { query } = require('../db');
const { formatCpf, onlyDigits } = require('../util');
const { flash } = require('../middleware');
const pacienteService = require('../services/pacienteService');

router.get('/', (req, res) => {
  res.redirect(req.session.paciente ? '/consultas' : '/login');
});

router.get('/login', (req, res) => {
  if (req.session.paciente) return res.redirect('/consultas');
  res.render('login', { title: 'Acesso ao sistema', erro: null, cpf: '' });
});

router.post('/login', async (req, res) => {
  const cpf = formatCpf(req.body.cpf);

  if (onlyDigits(cpf).length !== 11) {
    return res.render('login', { title: 'Acesso ao sistema', erro: 'O CPF é obrigatório (11 dígitos).', cpf: req.body.cpf || '' });
  }

  const r = await query('SELECT Codigo, Nome FROM Paciente WHERE Cpf = @cpf', { cpf });
  const paciente = r.recordset[0];

  if (!paciente) {
    return res.render('login', {
      title: 'Acesso ao sistema',
      erro: 'CPF não encontrado. Faça seu cadastro primeiro.',
      cpf,
    });
  }

  // Nova sessão a cada login (evita fixação de sessão)
  await new Promise((ok, fail) => req.session.regenerate((e) => (e ? fail(e) : ok())));
  req.session.paciente = { id: paciente.Codigo, nome: paciente.Nome };
  res.redirect('/consultas');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// Cadastro público: link exibido abaixo do login
router.get('/cadastro', (req, res) => {
  if (req.session.paciente) return res.redirect('/consultas');
  res.render('pacientes/form', {
    title: 'Cadastre-se',
    acao: '/cadastro',
    cancelar: '/login',
    paciente: {},
    erro: null,
  });
});

router.post('/cadastro', async (req, res) => {
  const { erro, paciente } = await pacienteService.criar(req.body);
  if (erro) {
    return res.render('pacientes/form', {
      title: 'Cadastre-se',
      acao: '/cadastro',
      cancelar: '/login',
      paciente,
      erro,
    });
  }
  flash(req, 'ok', 'Cadastro realizado! Entre com o seu CPF.');
  res.redirect('/login');
});

module.exports = router;
