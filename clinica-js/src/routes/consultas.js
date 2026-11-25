const router = require('express').Router();
const { query } = require('../db');
const { requireLogin, flash } = require('../middleware');
const { toSqlDateTime } = require('../util');

router.use(requireLogin);

const STATUS_INICIAL = 'Agendada';
const STATUS_PERMITIDOS = ['Realizada', 'Cancelada'];

// Mostra apenas as consultas do paciente logado
router.get('/', async (req, res) => {
  const r = await query(
    `SELECT c.Codigo, c.DataHora, c.StatusConsulta, m.Nome AS Medico, m.Especialidade
       FROM Consulta c
       JOIN Medico m ON m.Codigo = c.MedicoId
      WHERE c.PacienteId = @pid
      ORDER BY c.DataHora DESC`,
    { pid: req.session.paciente.id }
  );
  res.render('consultas/index', { title: 'Minhas consultas', consultas: r.recordset });
});

async function formNova(res, { valores = {}, erro = null } = {}) {
  const medicos = await query('SELECT Codigo, Nome, Especialidade FROM Medico ORDER BY Nome');
  res.render('consultas/nova', { title: 'Agendar consulta', medicos: medicos.recordset, valores, erro });
}

router.get('/nova', async (req, res) => {
  await formNova(res);
});

router.post('/', async (req, res) => {
  const pacienteId = req.session.paciente.id;
  const medicoId = Number(req.body.medicoId);
  const dataHora = (req.body.dataHora || '').trim(); // "2026-10-15T14:00"
  const valores = { medicoId, dataHora };

  if (!Number.isInteger(medicoId) || medicoId <= 0) {
    return formNova(res, { valores, erro: 'Selecione um médico.' });
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dataHora) || Number.isNaN(new Date(dataHora).getTime())) {
    return formNova(res, { valores, erro: 'Informe uma data e hora válidas.' });
  }
  if (new Date(dataHora) <= new Date()) {
    return formNova(res, { valores, erro: 'A data e hora da consulta devem ser futuras.' });
  }

  const medico = await query('SELECT Codigo FROM Medico WHERE Codigo = @id', { id: medicoId });
  if (!medico.recordset[0]) {
    return formNova(res, { valores, erro: 'Médico não encontrado.' });
  }

  // Regra de negócio: cada paciente só pode ter um agendamento por dia
  const dia = dataHora.slice(0, 10);
  const mesmoDia = await query(
    `SELECT COUNT(*) AS n
       FROM Consulta
      WHERE PacienteId = @pid
        AND CAST(DataHora AS DATE) = CAST(@dia AS DATE)
        AND StatusConsulta <> 'Cancelada'`,
    { pid: pacienteId, dia }
  );
  if (mesmoDia.recordset[0].n > 0) {
    return formNova(res, { valores, erro: 'Você já possui uma consulta agendada para este dia.' });
  }

  // R4: toda consulta nasce como "Agendada"
  await query(
    `INSERT INTO Consulta (DataHora, StatusConsulta, PacienteId, MedicoId)
     VALUES (@dh, @status, @pid, @mid)`,
    { dh: toSqlDateTime(dataHora), status: STATUS_INICIAL, pid: pacienteId, mid: medicoId }
  );
  flash(req, 'ok', 'Consulta agendada com sucesso!');
  res.redirect('/consultas');
});

// R4: Agendada -> Realizada ou Cancelada
router.post('/:id/status', async (req, res) => {
  const id = Number(req.params.id);
  const status = req.body.status;

  if (!STATUS_PERMITIDOS.includes(status)) {
    flash(req, 'erro', 'Status inválido.');
    return res.redirect('/consultas');
  }

  const r = await query(
    `UPDATE Consulta
        SET StatusConsulta = @status
      WHERE Codigo = @id
        AND PacienteId = @pid
        AND StatusConsulta = @inicial`,
    { id, status, pid: req.session.paciente.id, inicial: STATUS_INICIAL }
  );

  if (r.rowsAffected[0] === 0) {
    flash(req, 'erro', 'Só é possível alterar consultas suas que ainda estejam agendadas.');
  } else {
    flash(req, 'ok', `Consulta marcada como ${status.toLowerCase()}.`);
  }
  res.redirect('/consultas');
});

module.exports = router;
