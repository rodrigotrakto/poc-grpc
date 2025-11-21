const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const fs = require('fs');

// Caminho do arquivo proto
const PROTO_PATH = path.join(__dirname, 'proto', 'items.proto');

// Carregar items do arquivo JSON
const itemsPath = path.join(__dirname, 'items.json');
const items = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));

// Carregar definição do proto
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const itemsProto = grpc.loadPackageDefinition(packageDefinition).items;

// Implementar o serviço
const listar = (call, callback) => {
  // Converter os items para o formato esperado pelo proto
  const itemsResponse = items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description || '',
    createdAt: item.createdAt || '',
  }));

  callback(null, { items: itemsResponse });
};

// Criar servidor gRPC
const server = new grpc.Server();

server.addService(itemsProto.ItemsService.service, {
  listar: listar,
});

const GRPC_PORT = process.env.GRPC_PORT || 50051;

server.bindAsync(
  `0.0.0.0:${GRPC_PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) {
      console.error('Erro ao iniciar servidor gRPC:', error);
      return;
    }
    server.start();
    console.log(`Servidor gRPC rodando na porta ${port}`);
  }
);

module.exports = server;
