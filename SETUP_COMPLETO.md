# 🚀 Guia Completo: Setup gRPC-Web do Zero ao Funcionamento

Este guia explica **TUDO** que precisa ser feito para configurar o frontend Angular para consumir gRPC via gRPC-Web, desde o estado inicial até o funcionamento completo.

## 📋 Pré-requisitos

- Node.js instalado
- Angular CLI instalado (`npm install -g @angular/cli`)
- PowerShell ou Prompt de Comando

## 🔧 Passo 1: Instalar Dependências no Frontend

```powershell
cd frontend
npm install @improbable-eng/grpc-web protobufjs
```

**Importante:** O pacote correto é `@improbable-eng/grpc-web`, não `@grpc/grpc-web`.

## 📥 Passo 2: Baixar o grpcwebproxy

1. Acesse: https://github.com/improbable-eng/grpc-web/releases
2. Procure pela versão mais recente (ex: `v0.15.0`)
3. Na seção **Assets**, baixe: `grpcwebproxy-v0.15.0-win64.exe`
4. Salve o arquivo na **raiz do projeto**: `C:\Servidor\laragon\www\trakto\poc-grpc\grpcwebproxy-v0.15.0-win64.exe`

## ⚙️ Passo 3: Configurar Proxy no Angular

### 3.1 Criar arquivo `frontend/proxy.conf.json`

```json
{
  "/api/grpc": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug",
    "pathRewrite": {
      "^/api/grpc": ""
    }
  }
}
```

### 3.2 Atualizar `frontend/angular.json`

Adicione a configuração do proxy na seção `serve`:

```json
"serve": {
  "builder": "@angular/build:dev-server",
  "options": {
    "proxyConfig": "proxy.conf.json"
  },
  ...
}
```

### 3.3 Atualizar `frontend/package.json`

```json
"start": "ng serve --proxy-config proxy.conf.json"
```

## 🔌 Passo 4: Criar Serviço gRPC no Frontend

O serviço já deve estar criado em `frontend/src/app/grpc/grpc-items.service.ts`. Ele:

- Usa `protobufjs` para carregar e parsear o arquivo `.proto`
- Faz requisições via `XMLHttpRequest` para evitar problemas de CORS
- Decodifica a resposta base64 e Protobuf
- Retorna os dados como JSON

**URL usada:** `/api/grpc/items.ItemsService/Listar` (o proxy Angular redireciona para `http://localhost:8080`)

## 🚀 Passo 5: Iniciar Todos os Serviços

Você precisa ter **4 processos rodando simultaneamente**:

### Terminal 1: Backend HTTP + gRPC (porta 9000 e 50051)

```powershell
cd backend
node server.js
```

**Saída esperada:**

```
Servidor gRPC rodando na porta 50051
Servidor rodando na porta 9000
```

### Terminal 2: Proxy gRPC-Web (porta 8080)

```powershell
# Na raiz do projeto
.\grpcwebproxy-v0.15.0-win64.exe --backend_addr=localhost:50051 --run_tls_server=false --allow_all_origins --server_http_max_write_timeout=3600s --server_http_max_read_timeout=3600s
```

**⚠️ IMPORTANTE:** No PowerShell, use `.\` antes do nome do arquivo!

**Saída esperada:**

```
time="..." level=info msg="listening for http on: [::]:8080"
time="..." level=info msg="[core] Channel Connectivity change to READY"
```

### Terminal 3: Frontend Angular (porta 4200)

```powershell
cd frontend
npm start
```

**Saída esperada:**

```
Application bundle generation complete.
Local: http://localhost:4200/
```

## ✅ Passo 6: Verificar se Está Funcionando

1. Acesse: `http://localhost:4200`
2. Você deve ver duas colunas:
   - **Esquerda:** Itens (HTTP) - dados via REST
   - **Direita:** Itens (gRPC) - dados via gRPC-Web
3. Ambas devem mostrar os mesmos 10 primeiros itens
4. Métricas devem aparecer abaixo de cada título
5. Painel de comparação deve aparecer na parte inferior

## 🔍 Passo 7: Verificar no Console do Navegador

Abra o DevTools (F12) e verifique:

**Console:**

- `🚀 Iniciando requisições HTTP e gRPC simultaneamente...`
- `✅ HTTP concluído em Xms`
- `✅ gRPC concluído em Xms`
- `🔍 Iniciando chamada gRPC-Web via proxy Angular para: /api/grpc/items.ItemsService/Listar`
- `✅ Base64 decodificado: X bytes`

**Network:**

- Requisição para `localhost:4200/api/grpc/items.ItemsService/Listar`
- Status: `200 OK`
- Content-Type: `application/grpc-web-text`

## 📊 Entendendo o Fluxo

```
Frontend (Angular) - localhost:4200
    ↓ POST /api/grpc/items.ItemsService/Listar
    ↓ Content-Type: application/grpc-web-text
    ↓ Body: base64 (Protobuf)
Proxy Angular (localhost:4200)
    ↓ Redireciona para: http://localhost:8080/items.ItemsService/Listar
grpcwebproxy (localhost:8080)
    ↓ Converte gRPC-Web (HTTP/1.1) → gRPC (HTTP/2)
Servidor gRPC (localhost:50051)
    ↓ Processa e retorna Protobuf
grpcwebproxy
    ↓ Converte gRPC → gRPC-Web (base64)
Proxy Angular
    ↓ Retorna para o frontend
Frontend
    ↓ Decodifica base64 → Protobuf → JSON
    ↓ Exibe na tela
```

## 🎯 Arquivos Importantes

### Backend

- `backend/server.js` - Servidor Express (porta 9000) + inicia gRPC
- `backend/grpc-server.js` - Servidor gRPC (porta 50051)
- `backend/proto/items.proto` - Definição do serviço gRPC
- `backend/items.json` - Dados de exemplo (10.000 itens)

### Frontend

- `frontend/src/app/grpc/grpc-items.service.ts` - Serviço que faz chamadas gRPC-Web
- `frontend/src/app/items/items.ts` - Componente que exibe os dados
- `frontend/proxy.conf.json` - Configuração do proxy Angular
- `frontend/angular.json` - Configuração do proxy no Angular

### Raiz

- `grpcwebproxy-v0.15.0-win64.exe` - Proxy gRPC-Web

## ⚠️ Problemas Comuns

### Erro: "ERR_CONNECTION_REFUSED" na porta 8080

- **Solução:** Verifique se o `grpcwebproxy` está rodando no Terminal 2

### Erro: "No address added out of total 1 resolved errors: [listen EADDRINUSE: address already in use 0.0.0.0:50051]"

- **Solução:** O servidor gRPC já está rodando. Não execute `node grpc-server.js` separadamente, pois `server.js` já inicia o gRPC.

### Erro: "'grpcwebproxy-v0.15.0-win64.exe' não é reconhecido"

- **Solução:** No PowerShell, use `.\grpcwebproxy-v0.15.0-win64.exe` (com `.\` antes)

### Erro: "404 (Not Found)" no frontend

- **Solução:** Verifique se o `proxy.conf.json` está correto e se o Angular foi reiniciado após criar o arquivo

### Erro: "Failed to decode base64"

- **Solução:** Verifique se o `grpcwebproxy` está retornando dados corretos. Veja os logs no Terminal 2.

### CORS errors

- **Solução:** O proxy Angular resolve isso. Certifique-se de que `proxy.conf.json` está configurado e o Angular foi reiniciado.

## 📝 Notas Importantes

1. **Proxy Angular só funciona em desenvolvimento** (`ng serve`)

   - Para produção, configure CORS no servidor ou use Envoy Proxy

2. **gRPC-Web vs gRPC nativo:**

   - gRPC-Web adiciona overhead (conversões, base64)
   - Em produção com gRPC nativo (backend para backend), é mais rápido
   - A principal vantagem aqui é **economia de bytes** (30-50% menor que JSON)

3. **Ordem de inicialização:**

   - 1º: Backend (server.js)
   - 2º: Proxy (grpcwebproxy)
   - 3º: Frontend (npm start)

4. **Métricas exibidas:**
   - ⏱️ Tempo: Duração da requisição
   - 📤 Request: Tamanho da requisição
   - 📥 Response: Tamanho da resposta
   - 📊 Total: Soma de request + response

## ✅ Checklist Final

- [ ] Dependências instaladas no frontend
- [ ] grpcwebproxy baixado e na raiz do projeto
- [ ] proxy.conf.json criado
- [ ] angular.json atualizado
- [ ] package.json atualizado
- [ ] Backend rodando (porta 9000 e 50051)
- [ ] Proxy rodando (porta 8080)
- [ ] Frontend rodando (porta 4200)
- [ ] Página carregando sem erros
- [ ] Ambas as colunas mostrando dados
- [ ] Métricas aparecendo
- [ ] Painel de comparação aparecendo

## 🎉 Pronto!

Se todos os itens do checklist estão marcados, você tem um sistema funcionando com:

- ✅ Frontend Angular consumindo gRPC-Web
- ✅ Comparação lado a lado: HTTP vs gRPC
- ✅ Métricas de performance
- ✅ Economia de bytes visível
