const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// CADASTRO
router.post('/register', async (req, res) => {
  const { nome, email, senha, telefone, cpf, perfil } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' });

  try {
    const existe = await db.get2('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existe) return res.status(400).json({ erro: 'Email já cadastrado.' });

    const senhaCriptografada = bcrypt.hashSync(senha, 12);
    const result = await db.run2(
      'INSERT INTO usuarios (nome, email, senha, telefone, cpf, perfil) VALUES (?, ?, ?, ?, ?, ?)',
      [nome, email, senhaCriptografada, telefone, cpf, perfil || 'paciente']
    );

    const token = generateToken(result.lastInsertRowid);
    res.status(201).json({
      mensagem: 'Usuário cadastrado com sucesso!',
      token,
      usuario: { id: result.lastInsertRowid, nome, email, perfil: perfil || 'paciente' }
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });

  try {
    const usuario = await db.get2('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (!usuario) return res.status(401).json({ erro: 'Email ou senha inválidos.' });

    const senhaCorreta = bcrypt.compareSync(senha, usuario.senha);
    if (!senhaCorreta) return res.status(401).json({ erro: 'Email ou senha inválidos.' });

    const token = generateToken(usuario.id);
    res.json({
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil }
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;