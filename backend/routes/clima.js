const express = require('express');
const axios = require('axios');
const proteger = require('../middleware/auth');

const router = express.Router();

router.get('/', proteger, async (req, res) => {
  const { cidade, data } = req.query;

  if (!cidade || !data) {
    return res.status(400).json({ erro: 'Cidade e data são obrigatórias.' });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ erro: 'API de clima não configurada.' });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cidade)},BR&appid=${apiKey}&units=metric&lang=pt_br`;
    const resposta = await axios.get(url);

    // Filtra previsões do dia solicitado
    const previsoes = resposta.data.list.filter(p => p.dt_txt.startsWith(data));

    if (previsoes.length === 0) {
      return res.status(404).json({ erro: 'Sem previsão para esta data. Máximo 5 dias à frente.' });
    }

    const temChuva = previsoes.some(p =>
      p.weather.some(w => ['Rain', 'Drizzle', 'Thunderstorm'].includes(w.main))
    );

    const principal = previsoes[0];

    res.json({
      cidade: resposta.data.city.name,
      data,
      temChuva,
      alerta: temChuva ? '⚠️ Há previsão de chuva! Lembre-se do guarda-chuva.' : '☀️ Tempo bom para a consulta!',
      temperatura: Math.round(principal.main.temp),
      sensacao: Math.round(principal.main.feels_like),
      umidade: principal.main.humidity,
      descricao: principal.weather[0].description,
    });

  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ erro: 'Cidade não encontrada.' });
    }
    res.status(500).json({ erro: 'Erro ao consultar previsão do tempo.' });
  }
});

module.exports = router;