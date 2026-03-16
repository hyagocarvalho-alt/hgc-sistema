const jwt = require('jsonwebtoken');
const db = require('../database');

module.exports = (req, res, next) => {
  // Pega o token do cabeçalho
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verifica e decodifica o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Busca o usuário no banco
    const usuario = db.prepare('SELECT id, nome, email, perfil FROM usuarios WHERE id = ?').get(decoded.id);

    if (!usuario) {
      return res.status(401).json({ erro: 'Usuário não encontrado.' });
    }

    // Salva o usuário na requisição para usar nas rotas
    req.usuario = usuario;
    next();

  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
};