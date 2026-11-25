const router = require('express').Router();
const { query } = require('../db');
const { requireLogin, flash } = require('../middleware');
const { erroDuplicado, erroChaveEstrangeira } = require('../util');

router.use(requireLogin);

function normalizar(body) {
  return {
    Nome: (body.nome || '').trim(),
    Crm: (body.crm || '').trim(),
    Especialidade: (body.especialidade || '').trim(),
  };
}

function validar(m) {
  if (!m.Nome) return 'Informe o nome.';
  if (!m.Crm) return 'Informe o CRM.';
  if (m.Crm.length > 20) return 'O CRM deve ter no máximo 20 caracteres.';
  if (!m.Especialidade) return 'Informe a especialidade.';
  if (m.Especialidade.length > 50) return 'A especialidade deve ter no máximo 50 caracteres.';
  return null;
}

function form(res, { title, acao, medico, erro = null }) {
  res.render('medicos/form', { title, acao, medico, erro });
}

router.get('/', async (req, res) => {
  const r = await query('SELECT * FROM Medico ORDER BY Nome');
  res.render('medicos/index', { title: 'Médicos', medicos: r.recordset });
});

router.get('/novo', (req, res) => {
  form(res, { title: 'Novo médico', acao: '/medicos', medico: {} });
});

router.post('/', async (req, res) => {
  const medico = normalizar(req.body);
  const erro = validar(medico);
  if (erro) return form(res, { title: 'Novo médico', acao: '/medicos', medico, erro });

  try {
    await query(
      'INSERT INTO Medico (Nome, Crm, Especialidade) VALUES (@nome, @crm, @esp)',
      { nome: medico.Nome, crm: medico.Crm, esp: medico.Especialidade }
    );
  } catch (e) {
    if (erroDuplicado(e)) {
      return form(res, { title: 'Novo médico', acao: '/medicos', medico, erro: 'Já existe um médico com este CRM.' });
    }
    throw e;
  }
  flash(req, 'ok', 'Médico cadastrado.');
  res.redirect('/medicos');
});

router.get('/:id/editar', async (req, res) => {
  const id = Number(req.params.id);
  const r = await query('SELECT * FROM Medico WHERE Codigo = @id', { id });
  if (!r.recordset[0]) {
    flash(req, 'erro', 'Médico não encontrado.');
    return res.redirect('/medicos');
  }
  form(res, { title: 'Editar médico', acao: `/medicos/${id}`, medico: r.recordset[0] });
});

router.post('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const medico = normalizar(req.body);
  medico.Codigo = id;
  const titulo = { title: 'Editar médico', acao: `/medicos/${id}` };
  const erro = validar(medico);
  if (erro) return form(res, { ...titulo, medico, erro });

  try {
    const r = await query(
      'UPDATE Medico SET Nome = @nome, Crm = @crm, Especialidade = @esp WHERE Codigo = @id',
      { id, nome: medico.Nome, crm: medico.Crm, esp: medico.Especialidade }
    );
    if (r.rowsAffected[0] === 0) {
      flash(req, 'erro', 'Médico não encontrado.');
      return res.redirect('/medicos');
    }
  } catch (e) {
    if (erroDuplicado(e)) {
      return form(res, { ...titulo, medico, erro: 'Já existe um médico com este CRM.' });
    }
    throw e;
  }
  flash(req, 'ok', 'Médico atualizado.');
  res.redirect('/medicos');
});

// R5: não excluir médico com consultas no histórico
router.post('/:id/excluir', async (req, res) => {
  const id = Number(req.params.id);

  const c = await query('SELECT COUNT(*) AS n FROM Consulta WHERE MedicoId = @id', { id });
  if (c.recordset[0].n > 0) {
    flash(req, 'erro', 'Não é possível excluir: o médico possui consultas no histórico.');
    return res.redirect('/medicos');
  }

  try {
    await query('DELETE FROM Medico WHERE Codigo = @id', { id });
  } catch (e) {
    if (erroChaveEstrangeira(e)) {
      flash(req, 'erro', 'Não é possível excluir: o médico possui consultas no histórico.');
      return res.redirect('/medicos');
    }
    throw e;
  }
  flash(req, 'ok', 'Médico excluído.');
  res.redirect('/medicos');
});

module.exports = router;
