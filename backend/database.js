const Database = require('better-sqlite3');
const path = require('path');

// Cria o arquivo do banco na pasta backend
const db = new Database(path.join(__dirname, 'clinica.db'));

// Ativa chaves estrangeiras
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Cria as tabelas se não existirem
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    perfil TEXT DEFAULT 'paciente',
    telefone TEXT,
    cpf TEXT,
    criado_em TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS agendamentos (
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
  );
`);

console.log('✅ Banco de dados pronto!');

module.exports = db;