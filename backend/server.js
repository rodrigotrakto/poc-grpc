const grpcServer = require('./grpc-server');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
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

// Carregar items do arquivo JSON
const itemsPath = path.join(__dirname, 'items.json');
const items = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));

// Carregar proto para criar cliente gRPC
const PROTO_PATH = path.join(__dirname, 'proto', 'items.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const itemsProto = grpc.loadPackageDefinition(packageDefinition).items;

// Criar cliente gRPC para chamar o servidor gRPC local
const GRPC_PORT = process.env.GRPC_PORT || 50051;
const grpcClient = new itemsProto.ItemsService(
  `localhost:${GRPC_PORT}`,
  grpc.credentials.createInsecure()
);

app.get('/status', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/items', (req, res) => {
  res.json({ items });
});

// Endpoint que chama o gRPC internamente e retorna JSON
// Isso simula o que o proxy gRPC-Web faria
app.post('/listar', (req, res) => {
  grpcClient.listar({}, (error, response) => {
    if (error) {
      console.error('Erro ao chamar gRPC:', error);
      res.status(500).json({ error: 'Erro ao buscar items via gRPC' });
      return;
    }
    res.json(response);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
