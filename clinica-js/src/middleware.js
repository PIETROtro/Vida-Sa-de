// Protege rotas: só entra quem está logado (equivale ao [Authorize] do guia).
function requireLogin(req, res, next) {
  if (!req.session.paciente) return res.redirect('/login');
  next();
}

function flash(req, tipo, texto) {
  req.session.flash = { tipo, texto };
}

module.exports = { requireLogin, flash };
