const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 9000;

// Habilitar CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Middleware para parsing JSON
app.use(express.json());

// Carregar items do arquivo JSON
const itemsPath = path.join(__dirname, 'items.json');
const items = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));

app.get('/status', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/items', (req, res) => {
  res.json({ items });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
