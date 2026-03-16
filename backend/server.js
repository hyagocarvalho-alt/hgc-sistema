require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');
const authRoutes = require('./routes/auth');
const agendamentosRoutes = require('./routes/agendamentos');
const cepRoutes = require('./routes/cep');
const climaRoutes = require('./routes/clima');        // ← novo
const proteger = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/agendamentos', agendamentosRoutes);
app.use('/api/cep', cepRoutes);
app.use('/api/clima', climaRoutes);                  // ← novo

app.get('/api/perfil', proteger, (req, res) => {
  res.json({ mensagem: `Olá, ${req.usuario.nome}!`, usuario: req.usuario });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mensagem: 'Servidor da ClínicaVita funcionando! 🏥' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});