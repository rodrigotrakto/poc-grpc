const express = require('express');
const app = express();
const PORT = process.env.PORT || 9000;

app.get('/status', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
