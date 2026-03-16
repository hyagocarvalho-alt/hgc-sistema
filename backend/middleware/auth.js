const jwt = require('jsonwebtoken');
const db = require('../database');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await db.get2('SELECT id, nome, email, perfil FROM usuarios WHERE id = ?', [decoded.id]);

    if (!usuario) return res.status(401).json({ erro: 'Usuário não encontrado.' });

    req.usuario = usuario;
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
};