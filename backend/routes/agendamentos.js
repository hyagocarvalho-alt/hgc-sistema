const express = require('express');
const axios = require('axios');
const db = require('../database');
const proteger = require('../middleware/auth');

const router = express.Router();
router.use(proteger);

// LISTAR
router.get('/', async (req, res) => {
  try {
    let agendamentos;
    if (req.usuario.perfil === 'paciente') {
      agendamentos = await db.query(`
        SELECT a.*, u.nome as paciente_nome, u.email as paciente_email
        FROM agendamentos a JOIN usuarios u ON a.paciente_id = u.id
        WHERE a.paciente_id = ? ORDER BY a.data ASC, a.horario ASC
      `, [req.usuario.id]);
    } else {
      agendamentos = await db.query(`
        SELECT a.*, u.nome as paciente_nome, u.email as paciente_email
        FROM agendamentos a JOIN usuarios u ON a.paciente_id = u.id
        ORDER BY a.data ASC, a.horario ASC
      `);
    }
    res.json({ total: agendamentos.length, agendamentos });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// HORÁRIOS DISPONÍVEIS
router.get('/horarios', async (req, res) => {
  const { data, medico } = req.query;
  if (!data || !medico) return res.status(400).json({ erro: 'Data e médico são obrigatórios.' });

  const todosHorarios = [
    '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
    '14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'
  ];

  try {
    const ocupados = await db.query(
      `SELECT horario FROM agendamentos WHERE data = ? AND medico = ? AND status != 'cancelado'`,
      [data, medico]
    );
    const horariosOcupados = ocupados.map(a => a.horario);
    const disponiveis = todosHorarios.filter(h => !horariosOcupados.includes(h));
    res.json({ disponiveis, ocupados: horariosOcupados });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// CRIAR
router.post('/', async (req, res) => {
  const { medico, especialidade, data, horario, observacoes, cidade } = req.body;
  if (!medico || !especialidade || !data || !horario) {
    return res.status(400).json({ erro: 'Médico, especialidade, data e horário são obrigatórios.' });
  }

  try {
    const ocupado = await db.get2(
      `SELECT id FROM agendamentos WHERE data = ? AND medico = ? AND horario = ? AND status != 'cancelado'`,
      [data, medico, horario]
    );
    if (ocupado) return res.status(409).json({ erro: 'Horário já ocupado. Escolha outro.' });

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

    const result = await db.run2(
      `INSERT INTO agendamentos (paciente_id, medico, especialidade, data, horario, observacoes, chuva, clima_descricao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.usuario.id, medico, especialidade, data, horario, observacoes, temChuva, climaDescricao]
    );

    const agendamento = await db.get2('SELECT * FROM agendamentos WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({
      mensagem: temChuva ? '⚠️ Consulta agendada! Há previsão de chuva neste dia.' : '✅ Consulta agendada com sucesso!',
      agendamento
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ATUALIZAR STATUS
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const statusValidos = ['agendado', 'confirmado', 'realizado', 'cancelado'];
  if (!statusValidos.includes(status)) return res.status(400).json({ erro: 'Status inválido.' });

  try {
    const agendamento = await db.get2('SELECT * FROM agendamentos WHERE id = ?', [req.params.id]);
    if (!agendamento) return res.status(404).json({ erro: 'Agendamento não encontrado.' });

    if (req.usuario.perfil === 'paciente' && agendamento.paciente_id !== req.usuario.id) {
      return res.status(403).json({ erro: 'Sem permissão.' });
    }

    await db.run2('UPDATE agendamentos SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ mensagem: 'Status atualizado!', status });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;