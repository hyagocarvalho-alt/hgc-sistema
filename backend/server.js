require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');
const authRoutes = require('./routes/auth');
const agendamentosRoutes = require('./routes/agendamentos');
const cepRoutes = require('./routes/cep');
const climaRoutes = require('./routes/clima');
const proteger = require('./middleware/auth');

const app = express();

// ← Atualiza o CORS
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:5173',
    'https://hgc-sistema.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/agendamentos', agendamentosRoutes);
app.use('/api/cep', cepRoutes);
app.use('/api/clima', climaRoutes);

app.get('/api/perfil', proteger, (req, res) => {
  res.json({ mensagem: `Olá, ${req.usuario.nome}!`, usuario: req.usuario });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mensagem: 'Servidor da HGC funcionando! 🏥' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});