const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();

// ── CADASTRO ──────────────────────────────
router.post('/register', (req, res) => {
  const { nome, email, senha, telefone, cpf, perfil } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' });
  }

  // Verifica se email já existe
  const existe = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
  if (existe) {
    return res.status(400).json({ erro: 'Email já cadastrado.' });
  }

  // Criptografa a senha
  const senhaCriptografada = bcrypt.hashSync(senha, 12);

  // Salva no banco
  const result = db.prepare(`
    INSERT INTO usuarios (nome, email, senha, telefone, cpf, perfil)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(nome, email, senhaCriptografada, telefone, cpf, perfil || 'paciente');

  // Gera o token JWT
  const token = jwt.sign(
    { id: result.lastInsertRowid },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.status(201).json({
    mensagem: 'Usuário cadastrado com sucesso!',
    token,
    usuario: { id: result.lastInsertRowid, nome, email, perfil: perfil || 'paciente' }
  });
});

// ── LOGIN ──────────────────────────────────
router.post('/login', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
  }

  // Busca o usuário
  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  if (!usuario) {
    return res.status(401).json({ erro: 'Email ou senha inválidos.' });
  }

  // Verifica a senha
  const senhaCorreta = bcrypt.compareSync(senha, usuario.senha);
  if (!senhaCorreta) {
    return res.status(401).json({ erro: 'Email ou senha inválidos.' });
  }

  // Gera o token JWT
  const token = jwt.sign(
    { id: usuario.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.json({
    mensagem: 'Login realizado com sucesso!',
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil }
  });
});

module.exports = router;