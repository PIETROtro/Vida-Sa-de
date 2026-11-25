function onlyDigits(valor) {
  return String(valor || '').replace(/\D/g, '');
}

// 11 dígitos -> 111.222.333-44 (mesmo formato usado nos dados do guia)
function formatCpf(valor) {
  const d = onlyDigits(valor);
  if (d.length !== 11) return String(valor || '').trim();
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

// Erros de UNIQUE do SQL Server
function erroDuplicado(e) {
  return !!e && (e.number === 2627 || e.number === 2601);
}

// Erro de FOREIGN KEY do SQL Server
function erroChaveEstrangeira(e) {
  return !!e && e.number === 547;
}

// "2026-10-15T14:00" -> "2026-10-15T14:00:00" (ISO 8601, independe do idioma do servidor)
function toSqlDateTime(valor) {
  return `${valor}:00`;
}

// Datas do SQL Server chegam como Date em UTC; exibimos o valor exatamente como foi gravado.
const fmtData = (d) => (d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '');
const fmtDataHora = (d) =>
  d ? new Date(d).toLocaleString('pt-BR', { timeZone: 'UTC', dateStyle: 'short', timeStyle: 'short' }) : '';
const valorData = (d) => (d ? (d instanceof Date ? d.toISOString().slice(0, 10) : String(d)) : '');

module.exports = {
  onlyDigits,
  formatCpf,
  erroDuplicado,
  erroChaveEstrangeira,
  toSqlDateTime,
  fmtData,
  fmtDataHora,
  valorData,
};
