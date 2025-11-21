# 🚀 POC gRPC - Instruções de Execução

Instruções mínimas para rodar o projeto.

## 📋 Pré-requisitos

- **Node.js** instalado
- **Angular CLI** instalado globalmente:
  ```bash
  npm install -g @angular/cli
  ```

## 🔧 Instalação

### 1. Instalar Dependências NPM

O `npm install` instala automaticamente todas as dependências listadas nos `package.json`:

#### Backend

```bash
cd backend
npm install
```

**Instala:** `@grpc/grpc-js`, `@grpc/proto-loader`, `express`

#### Frontend

```bash
cd frontend
npm install
```

**Instala:** Angular, `protobufjs`, `@improbable-eng/grpc-web`, e todas as dependências do projeto

### 2. Baixar grpcwebproxy (Manual)

O `npm install` **NÃO** instala o grpcwebproxy. Você precisa baixá-lo manualmente:

#### Windows

1. Acesse: https://github.com/improbable-eng/grpc-web/releases
2. Baixe: `grpcwebproxy-v0.15.0-win64.exe`
3. Coloque na **raiz do projeto** (mesmo nível de `backend/` e `frontend/`)

#### Linux

1. Acesse: https://github.com/improbable-eng/grpc-web/releases
2. Baixe: `grpcwebproxy-v0.15.0-linux-x86_64` (ou a versão para sua arquitetura)
3. Coloque na **raiz do projeto**
4. Dê permissão de execução:
   ```bash
   chmod +x grpcwebproxy-v0.15.0-linux-x86_64
   ```

### 3. Estrutura de Arquivos

Os arquivos de configuração já estão no projeto:

- ✅ `frontend/proxy.conf.json` - Configuração do proxy Angular
- ✅ `frontend/angular.json` - Já configurado com proxy
- ✅ `backend/proto/items.proto` - Definição do serviço gRPC
- ✅ `backend/items.json` - Dados de exemplo

**Não é necessário criar ou configurar nada manualmente além do grpcwebproxy.**

## 🚀 Execução

Execute os 3 serviços em terminais separados:

### 1️⃣ Backend (Terminal 1)

```bash
cd backend
node server.js
```

**Portas:** 9000 (HTTP) e 50051 (gRPC)

### 2️⃣ Proxy gRPC-Web (Terminal 2)

**⚠️ Importante:** Certifique-se de que o arquivo `grpcwebproxy` está na **raiz do projeto** antes de executar.

#### Windows

```bash
# Na raiz do projeto (mesmo nível de backend/ e frontend/)
.\grpcwebproxy-v0.15.0-win64.exe --backend_addr=localhost:50051 --run_tls_server=false --allow_all_origins
```

#### Linux

```bash
# Na raiz do projeto (mesmo nível de backend/ e frontend/)
./grpcwebproxy-v0.15.0-linux-x86_64 --backend_addr=localhost:50051 --run_tls_server=false --allow_all_origins
```

**Porta:** 8080

### 3️⃣ Frontend (Terminal 3)

```bash
cd frontend
npm start
```

**Porta:** 4200

## ✅ Verificação

1. Acesse: `http://localhost:4200`
2. Você deve ver duas colunas comparando HTTP vs gRPC
3. Métricas de performance serão exibidas abaixo de cada coluna

## 📊 Portas Utilizadas

- **9000** - Backend HTTP (REST API)
- **50051** - Backend gRPC
- **8080** - Proxy gRPC-Web
- **4200** - Frontend Angular

## ⚠️ Ordem de Inicialização

1. Backend primeiro
2. Proxy em seguida
3. Frontend por último

## 📁 Estrutura do Projeto

```
poc-grpc/
├── backend/
│   ├── server.js          # Servidor Express + gRPC
│   ├── grpc-server.js      # Servidor gRPC
│   ├── proto/
│   │   └── items.proto     # Definição do serviço
│   ├── items.json          # Dados de exemplo
│   └── package.json
├── frontend/
│   ├── src/
│   ├── proxy.conf.json     # Configuração do proxy
│   ├── angular.json        # Já configurado
│   └── package.json
└── grpcwebproxy-v0.15.0-*  # ⚠️ Baixar manualmente
```

## ❓ O que o npm install faz?

✅ **Instala automaticamente:**

- Todas as dependências do `package.json` (backend e frontend)
- Node modules em `backend/node_modules/` e `frontend/node_modules/`

❌ **NÃO instala:**

- `grpcwebproxy` (precisa baixar manualmente)
- Angular CLI (precisa instalar globalmente com `npm install -g @angular/cli`)

✅ **Já está configurado no projeto:**

- `proxy.conf.json` - Proxy do Angular
- `angular.json` - Configuração do Angular
- Arquivos `.proto` e dados de exemplo
