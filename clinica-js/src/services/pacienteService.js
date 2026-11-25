const { query } = require('../db');
const { formatCpf, onlyDigits, erroDuplicado } = require('../util');

function normalizar(body) {
  return {
    Nome: (body.nome || '').trim(),
    Cpf: formatCpf(body.cpf),
    Telefone: (body.telefone || '').trim(),
    DataNascimento: (body.dataNascimento || '').trim(),
  };
}

function validar(p) {
  if (!p.Nome) return 'Informe o nome.';
  if (onlyDigits(p.Cpf).length !== 11) return 'CPF inválido: informe os 11 dígitos.';
  if (!p.Telefone) return 'Informe o telefone.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.DataNascimento)) return 'Informe a data de nascimento.';
  if (new Date(p.DataNascimento) > new Date()) return 'A data de nascimento não pode estar no futuro.';
  return null;
}

async function criar(body) {
  const paciente = normalizar(body);
  const erro = validar(paciente);
  if (erro) return { erro, paciente };
  try {
    const r = await query(
      `INSERT INTO Paciente (Nome, Cpf, Telefone, DataNascimento)
       OUTPUT INSERTED.Codigo
       VALUES (@nome, @cpf, @telefone, @nasc)`,
      { nome: paciente.Nome, cpf: paciente.Cpf, telefone: paciente.Telefone, nasc: paciente.DataNascimento }
    );
    return { paciente, codigo: r.recordset[0].Codigo };
  } catch (e) {
    if (erroDuplicado(e)) return { erro: 'Já existe um paciente cadastrado com este CPF.', paciente };
    throw e;
  }
}

async function atualizar(id, body) {
  const paciente = normalizar(body);
  paciente.Codigo = id;
  const erro = validar(paciente);
  if (erro) return { erro, paciente };
  try {
    const r = await query(
      `UPDATE Paciente
          SET Nome = @nome, Cpf = @cpf, Telefone = @telefone, DataNascimento = @nasc
        WHERE Codigo = @id`,
      { id, nome: paciente.Nome, cpf: paciente.Cpf, telefone: paciente.Telefone, nasc: paciente.DataNascimento }
    );
    if (r.rowsAffected[0] === 0) return { erro: 'Paciente não encontrado.', paciente };
    return { paciente };
  } catch (e) {
    if (erroDuplicado(e)) return { erro: 'Já existe um paciente cadastrado com este CPF.', paciente };
    throw e;
  }
}

module.exports = { criar, atualizar };
