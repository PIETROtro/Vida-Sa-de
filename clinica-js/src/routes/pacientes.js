const router = require('express').Router();
const { query } = require('../db');
const { requireLogin, flash } = require('../middleware');
const { erroChaveEstrangeira } = require('../util');
const pacienteService = require('../services/pacienteService');

router.use(requireLogin);

router.get('/', async (req, res) => {
  const r = await query('SELECT * FROM Paciente ORDER BY Nome');
  res.render('pacientes/index', { title: 'Pacientes', pacientes: r.recordset });
});

router.get('/novo', (req, res) => {
  res.render('pacientes/form', {
    title: 'Novo paciente',
    acao: '/pacientes',
    cancelar: '/pacientes',
    paciente: {},
    erro: null,
  });
});

router.post('/', async (req, res) => {
  const { erro, paciente } = await pacienteService.criar(req.body);
  if (erro) {
    return res.render('pacientes/form', {
      title: 'Novo paciente',
      acao: '/pacientes',
      cancelar: '/pacientes',
      paciente,
      erro,
    });
  }
  flash(req, 'ok', 'Paciente cadastrado.');
  res.redirect('/pacientes');
});

router.get('/:id/editar', async (req, res) => {
  const id = Number(req.params.id);
  const r = await query('SELECT * FROM Paciente WHERE Codigo = @id', { id });
  if (!r.recordset[0]) {
    flash(req, 'erro', 'Paciente não encontrado.');
    return res.redirect('/pacientes');
  }
  res.render('pacientes/form', {
    title: 'Editar paciente',
    acao: `/pacientes/${id}`,
    cancelar: '/pacientes',
    paciente: r.recordset[0],
    erro: null,
  });
});

router.post('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { erro, paciente } = await pacienteService.atualizar(id, req.body);
  if (erro) {
    return res.render('pacientes/form', {
      title: 'Editar paciente',
      acao: `/pacientes/${id}`,
      cancelar: '/pacientes',
      paciente,
      erro,
    });
  }
  // Mantém o nome exibido no topo atualizado se o paciente editou a si mesmo
  if (req.session.paciente.id === id) req.session.paciente.nome = paciente.Nome;
  flash(req, 'ok', 'Paciente atualizado.');
  res.redirect('/pacientes');
});

// R5: não excluir paciente com consultas no histórico
router.post('/:id/excluir', async (req, res) => {
  const id = Number(req.params.id);

  const c = await query('SELECT COUNT(*) AS n FROM Consulta WHERE PacienteId = @id', { id });
  if (c.recordset[0].n > 0) {
    flash(req, 'erro', 'Não é possível excluir: o paciente possui consultas no histórico.');
    return res.redirect('/pacientes');
  }

  try {
    await query('DELETE FROM Paciente WHERE Codigo = @id', { id });
  } catch (e) {
    if (erroChaveEstrangeira(e)) {
      flash(req, 'erro', 'Não é possível excluir: o paciente possui consultas no histórico.');
      return res.redirect('/pacientes');
    }
    throw e;
  }

  // Se o paciente excluiu o próprio cadastro, encerra a sessão
  if (req.session.paciente.id === id) {
    return req.session.destroy(() => res.redirect('/login'));
  }
  flash(req, 'ok', 'Paciente excluído.');
  res.redirect('/pacientes');
});

module.exports = router;
