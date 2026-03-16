const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'clinica.db'));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    perfil TEXT DEFAULT 'paciente',
    telefone TEXT,
    cpf TEXT,
    criado_em TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS agendamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL,
    medico TEXT NOT NULL,
    especialidade TEXT NOT NULL,
    data TEXT NOT NULL,
    horario TEXT NOT NULL,
    status TEXT DEFAULT 'agendado',
    observacoes TEXT,
    chuva INTEGER DEFAULT 0,
    clima_descricao TEXT,
    criado_em TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (paciente_id) REFERENCES usuarios(id)
  )`);

  console.log('✅ Banco de dados pronto!');
});

// Helper para queries
db.query = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
});

db.run2 = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    err ? reject(err) : resolve({ lastInsertRowid: this.lastID, changes: this.changes });
  });
});

db.get2 = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});

module.exports = db;