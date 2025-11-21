# Passo a Passo: Consumir gRPC no Frontend Angular

## ✅ O que já foi feito

1. ✅ Dependências instaladas: `@improbable-eng/grpc-web` e `google-protobuf`
2. ✅ Serviço gRPC criado: `frontend/src/app/grpc/grpc-items.service.ts`
3. ✅ Componente atualizado para exibir ambos os resultados (HTTP e gRPC)
4. ✅ Estilos CSS adicionados para layout em duas colunas
5. ✅ **Endpoint HTTP `/listar` criado no backend que chama o gRPC internamente** (solução simplificada)

## 🎉 Solução Implementada

Foi criada uma **solução simplificada** que não requer proxy externo:

- O backend agora tem um endpoint `POST /listar` que chama o servidor gRPC internamente
- O frontend consome esse endpoint HTTP que por trás usa gRPC
- Isso evita a necessidade de configurar `grpcwebproxy` ou Envoy para desenvolvimento

## 📋 Como usar

### Passo 1: Iniciar o servidor gRPC

O servidor gRPC é iniciado automaticamente quando você inicia o servidor Express, pois o `grpc-server.js` é importado no `server.js`.

### Passo 2: Iniciar o backend

```powershell
# No diretório backend
node server.js
```

Você deve ver:
- `Servidor gRPC rodando na porta 50051`
- `Servidor rodando na porta 9000`

### Passo 3: Iniciar o frontend

```powershell
# No diretório frontend
npm start
```

### Passo 4: Testar

Acesse `http://localhost:4200` e você deve ver:
- **Coluna esquerda:** Itens (HTTP) - consumindo `/items`
- **Coluna direita:** Itens (gRPC) - consumindo `/listar` (que chama gRPC internamente)

## 🔄 Alternativa: Usar Proxy gRPC-Web (Opcional)

Se você quiser usar um proxy gRPC-Web real (como em produção), siga os passos abaixo:

### Passo 1: Configurar o Proxy gRPC-Web

O navegador não suporta gRPC nativo (HTTP/2), então é necessário um proxy que converte gRPC-Web (HTTP/1.1) para gRPC (HTTP/2).

#### Opção A: Usar grpcwebproxy (Recomendado para desenvolvimento)

1. **Baixar o grpcwebproxy:**
   - Acesse: https://github.com/improbable-eng/grpc-web/releases
   - Baixe a versão para Windows (ex: `grpcwebproxy-windows-amd64.exe`)

2. **Executar o proxy:**
   ```powershell
   .\grpcwebproxy-windows-amd64.exe --backend_addr=localhost:50051 --run_tls_server=false --allow_all_origins
   ```

   O proxy rodará na porta **8080** por padrão.

3. **Verificar se está funcionando:**
   - O proxy deve mostrar: `Starting gRPC-Web proxy on :8080`

#### Opção B: Usar Envoy Proxy (Recomendado para produção)

1. **Instalar Envoy:**
   - Windows: Use Docker ou WSL, ou baixe o binário de https://www.envoyproxy.io/downloads

2. **Criar arquivo `envoy.yaml`:**
   ```yaml
   static_resources:
     listeners:
       - name: listener_0
         address:
           socket_address:
             address: 0.0.0.0
             port_value: 8080
         filter_chains:
           - filters:
               - name: envoy.filters.network.http_connection_manager
                 typed_config:
                   "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                   codec_type: AUTO
                   stat_prefix: ingress_http
                   route_config:
                     name: local_route
                     virtual_hosts:
                       - name: backend
                         domains: ["*"]
                         routes:
                           - match:
                               prefix: "/"
                             route:
                               cluster: grpc_backend
                               max_grpc_timeout: 0s
                   http_filters:
                     - name: envoy.filters.http.grpc_web
                     - name: envoy.filters.http.cors
                     - name: envoy.filters.http.router
     clusters:
       - name: grpc_backend
         type: LOGICAL_DNS
         http2_protocol_options: {}
         load_assignment:
           cluster_name: grpc_backend
           endpoints:
             - lb_endpoints:
                 - endpoint:
                     address:
                       socket_address:
                         address: 127.0.0.1
                         port_value: 50051
   ```

3. **Executar Envoy:**
   ```powershell
   envoy -c envoy.yaml
   ```

### Passo 2: Verificar se o servidor gRPC está rodando

Certifique-se de que o servidor gRPC do backend está rodando na porta **50051**:

```powershell
# No diretório backend
node grpc-server.js
```

Você deve ver: `Servidor gRPC rodando na porta 50051`

### Passo 3: Testar o frontend

1. **Iniciar o frontend:**
   ```powershell
   # No diretório frontend
   npm start
   ```

2. **Acessar a aplicação:**
   - Abra o navegador em: `http://localhost:4200`
   - Você deve ver duas colunas:
     - **Esquerda:** Itens (HTTP) - consumindo `/items`
     - **Direita:** Itens (gRPC) - consumindo `/listar` via gRPC

### Passo 4: Verificar erros

Se a coluna gRPC não mostrar dados:

1. **Verifique o console do navegador (F12):**
   - Procure por erros relacionados a CORS ou conexão

2. **Verifique se o proxy está rodando:**
   - O `grpcwebproxy` deve estar ativo na porta 8080

3. **Verifique se o servidor gRPC está rodando:**
   - O backend gRPC deve estar na porta 50051

4. **Verifique a URL no serviço:**
   - O arquivo `grpc-items.service.ts` usa `http://localhost:8080`
   - Se o proxy estiver em outra porta, ajuste a URL

## 🔧 Estrutura de Arquivos Criada

```
frontend/
├── src/
│   └── app/
│       ├── grpc/
│       │   ├── items.proto          # Arquivo proto (já existe)
│       │   └── grpc-items.service.ts # Serviço gRPC (criado)
│       └── items/
│           ├── items.ts             # Componente (atualizado)
│           ├── items.html           # Template (atualizado)
│           └── items.scss           # Estilos (criado)
```

## 📝 Notas Importantes

1. **Proxy é obrigatório:** O navegador não suporta gRPC nativo, então o proxy é essencial.

2. **Formato das mensagens:** O serviço atual tenta trabalhar com a resposta do gRPC sem precisar gerar código a partir do proto. Se houver problemas, pode ser necessário gerar as mensagens protobuf corretamente.

3. **CORS:** O `grpcwebproxy` com `--allow_all_origins` já resolve CORS automaticamente.

4. **Portas:**
   - Backend HTTP: `9000`
   - Backend gRPC: `50051`
   - Proxy gRPC-Web: `8080`
   - Frontend Angular: `4200`

## 🚀 Resumo dos Comandos

```powershell
# Terminal 1: Backend HTTP
cd backend
node server.js

# Terminal 2: Backend gRPC
cd backend
node grpc-server.js

# Terminal 3: Proxy gRPC-Web
.\grpcwebproxy-windows-amd64.exe --backend_addr=localhost:50051 --run_tls_server=false --allow_all_origins

# Terminal 4: Frontend
cd frontend
npm start
```

## ❓ Troubleshooting

**Erro: "Failed to fetch" ou CORS:**
- Certifique-se de que o `grpcwebproxy` está rodando com `--allow_all_origins`

**Erro: "Connection refused":**
- Verifique se o servidor gRPC está rodando na porta 50051
- Verifique se o proxy está apontando para a porta correta

**Coluna gRPC vazia:**
- Abra o console do navegador (F12) e verifique os erros
- Verifique se o proxy está recebendo as requisições
- Verifique se o servidor gRPC está respondendo corretamente

