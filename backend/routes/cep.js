const express = require('express');
const axios = require('axios');
const proteger = require('../middleware/auth');

const router = express.Router();

router.get('/:cep', proteger, async (req, res) => {
  const cep = req.params.cep.replace(/\D/g, '');

  if (cep.length !== 8) {
    return res.status(400).json({ erro: 'CEP deve ter 8 dígitos.' });
  }

  try {
    const resposta = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);

    if (resposta.data.erro) {
      return res.status(404).json({ erro: 'CEP não encontrado.' });
    }

    res.json({
      cep,
      rua: resposta.data.logradouro,
      bairro: resposta.data.bairro,
      cidade: resposta.data.localidade,
      estado: resposta.data.uf
    });

  } catch (err) {
    res.status(500).json({ erro: 'Erro ao consultar CEP.' });
  }
});

module.exports = router;