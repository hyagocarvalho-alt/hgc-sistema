const express = require('express');
const axios = require('axios');
const db = require('../database');
const proteger = require('../middleware/auth');

const router = express.Router();

// Todas as rotas precisam de login
router.use(proteger);

// ── LISTAR AGENDAMENTOS ────────────────────
router.get('/', (req, res) => {
  let agendamentos;

  // Paciente vê só os seus, admin/secretário vê todos
  if (req.usuario.perfil === 'paciente') {
    agendamentos = db.prepare(`
      SELECT a.*, u.nome as paciente_nome, u.email as paciente_email
      FROM agendamentos a
      JOIN usuarios u ON a.paciente_id = u.id
      WHERE a.paciente_id = ?
      ORDER BY a.data ASC, a.horario ASC
    `).all(req.usuario.id);
  } else {
    agendamentos = db.prepare(`
      SELECT a.*, u.nome as paciente_nome, u.email as paciente_email
      FROM agendamentos a
      JOIN usuarios u ON a.paciente_id = u.id
      ORDER BY a.data ASC, a.horario ASC
    `).all();
  }

  res.json({ total: agendamentos.length, agendamentos });
});

// ── HORÁRIOS DISPONÍVEIS ───────────────────
router.get('/horarios', (req, res) => {
  const { data, medico } = req.query;

  if (!data || !medico) {
    return res.status(400).json({ erro: 'Data e médico são obrigatórios.' });
  }

  const todosHorarios = [
    '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
    '14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'
  ];

  const ocupados = db.prepare(`
    SELECT horario FROM agendamentos
    WHERE data = ? AND medico = ? AND status != 'cancelado'
  `).all(data, medico).map(a => a.horario);

  const disponiveis = todosHorarios.filter(h => !ocupados.includes(h));

  res.json({ disponiveis, ocupados });
});

// ── CRIAR AGENDAMENTO ──────────────────────
router.post('/', async (req, res) => {
  const { medico, especialidade, data, horario, observacoes, cidade } = req.body;

  if (!medico || !especialidade || !data || !horario) {
    return res.status(400).json({ erro: 'Médico, especialidade, data e horário são obrigatórios.' });
  }

  // Verifica se horário está disponível
  const ocupado = db.prepare(`
    SELECT id FROM agendamentos
    WHERE data = ? AND medico = ? AND horario = ? AND status != 'cancelado'
  `).get(data, medico, horario);

  if (ocupado) {
    return res.status(409).json({ erro: 'Horário já ocupado. Escolha outro.' });
  }

  // Verifica clima (se tiver cidade)
  let temChuva = 0;
  let climaDescricao = null;

  if (cidade && process.env.OPENWEATHER_API_KEY) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/forecast?q=${cidade},BR&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&lang=pt_br`;
      const resposta = await axios.get(url);
      const previsoes = resposta.data.list.filter(p => p.dt_txt.startsWith(data));
      temChuva = previsoes.some(p =>
        p.weather.some(w => ['Rain','Drizzle','Thunderstorm'].includes(w.main))
      ) ? 1 : 0;
      climaDescricao = previsoes[0]?.weather[0]?.description || null;
    } catch (e) {
      console.log('Clima não disponível:', e.message);
    }
  }

  // Salva no banco
  const result = db.prepare(`
    INSERT INTO agendamentos (paciente_id, medico, especialidade, data, horario, observacoes, chuva, clima_descricao)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.usuario.id, medico, especialidade, data, horario, observacoes, temChuva, climaDescricao);

  const agendamento = db.prepare('SELECT * FROM agendamentos WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({
    mensagem: temChuva
      ? '⚠️ Consulta agendada! Há previsão de chuva neste dia.'
      : '✅ Consulta agendada com sucesso!',
    agendamento
  });
});

// ── ATUALIZAR STATUS ───────────────────────
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const statusValidos = ['agendado', 'confirmado', 'realizado', 'cancelado'];

  if (!statusValidos.includes(status)) {
    return res.status(400).json({ erro: 'Status inválido.' });
  }

  // Paciente só pode cancelar o próprio
  const agendamento = db.prepare('SELECT * FROM agendamentos WHERE id = ?').get(req.params.id);

  if (!agendamento) {
    return res.status(404).json({ erro: 'Agendamento não encontrado.' });
  }

  if (req.usuario.perfil === 'paciente' && agendamento.paciente_id !== req.usuario.id) {
    return res.status(403).json({ erro: 'Sem permissão.' });
  }

  db.prepare('UPDATE agendamentos SET status = ? WHERE id = ?').run(status, req.params.id);

  res.json({ mensagem: 'Status atualizado!', status });
});

module.exports = router;