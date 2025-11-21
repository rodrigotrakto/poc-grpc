const grpcServer = require('./grpc-server');
const path = require('path');
const fs = require('fs');

const express = require('express');
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

// Middleware para medir tempo e tamanho das requisições
app.use((req, res, next) => {
  const startTime = Date.now();

  // Capturar tamanho da requisição
  let requestSize = 0;

  // Tamanho do Content-Length se disponível (mais preciso)
  const contentLength = req.get('content-length');
  if (contentLength) {
    requestSize = parseInt(contentLength, 10);
  } else {
    // Calcular manualmente se não houver Content-Length
    if (req.body) {
      requestSize += JSON.stringify(req.body).length;
    }
    if (req.query && Object.keys(req.query).length > 0) {
      requestSize += JSON.stringify(req.query).length;
    }
  }

  // Adicionar tamanho da linha de requisição HTTP (método + URL + versão)
  requestSize += req.method.length + 1 + req.originalUrl.length + 11; // "GET /path HTTP/1.1\r\n"

  // Adicionar tamanho dos headers HTTP
  Object.keys(req.headers).forEach((key) => {
    const value = req.headers[key] || '';
    requestSize +=
      key.length +
      2 +
      (Array.isArray(value) ? value.join(', ') : value).length +
      2; // "Key: Value\r\n"
  });

  // Adicionar tamanho da linha em branco final
  requestSize += 2; // "\r\n"

  // Interceptar o método res.json para medir tamanho da resposta
  const originalJson = res.json.bind(res);
  res.json = function (data) {
    const responseSize = JSON.stringify(data).length;
    const duration = Date.now() - startTime;

    // Adicionar headers com as métricas
    res.setHeader('X-Request-Duration', `${duration}`);
    res.setHeader('X-Request-Size', `${requestSize}`);
    res.setHeader('X-Response-Size', `${responseSize}`);
    res.setHeader('X-Total-Size', `${requestSize + responseSize}`);

    // Log no console
    console.log(
      `[${req.method} ${
        req.path
      }] Tempo: ${duration}ms | Request: ${requestSize} bytes | Response: ${responseSize} bytes | Total: ${
        requestSize + responseSize
      } bytes`
    );

    return originalJson(data);
  };

  next();
});

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
