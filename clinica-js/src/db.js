require('dotenv').config();
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'dbClinica',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

// Instância nomeada (ex.: .\SENAI) ou porta fixa (ex.: 1433)
if (process.env.DB_INSTANCE) {
  config.options.instanceName = process.env.DB_INSTANCE;
} else if (process.env.DB_PORT) {
  config.port = Number(process.env.DB_PORT);
}

let poolPromise;

function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .catch((err) => {
        poolPromise = null; // permite tentar de novo na próxima requisição
        throw err;
      });
  }
  return poolPromise;
}

// query('SELECT * FROM Paciente WHERE Codigo = @id', { id: 1 })
async function query(text, params = {}) {
  const pool = await getPool();
  const request = pool.request();
  for (const [nome, valor] of Object.entries(params)) {
    request.input(nome, valor);
  }
  return request.query(text);
}

module.exports = { query, getPool, sql };
