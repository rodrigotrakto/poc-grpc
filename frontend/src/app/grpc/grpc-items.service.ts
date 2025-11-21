import { Injectable } from '@angular/core';
import { grpc } from '@improbable-eng/grpc-web';
import * as protobuf from 'protobufjs';

export interface GrpcItem {
  id: number;
  name: string;
  description: string;
  createdAt: string;
}

interface ListarResponse {
  items: GrpcItem[];
}

export interface RequestMetrics {
  duration: number;
  requestSize: number;
  responseSize: number;
  totalSize: number;
}

// Definir manualmente o método gRPC (sem classes geradas)
interface MethodDefinition {
  methodName: string;
  service: {
    serviceName: string;
  };
  requestStream: boolean;
  responseStream: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class GrpcItemsService {
  /**
   * Decodifica base64 de forma mais robusta, lidando com caracteres inválidos
   */
  private decodeBase64(str: string): Uint8Array {
    // Remover todos os caracteres que não são base64 válidos
    let cleaned = str.replace(/[^A-Za-z0-9+/=]/g, '');

    // Adicionar padding se necessário
    while (cleaned.length % 4 !== 0) {
      cleaned += '=';
    }

    try {
      const binaryString = atob(cleaned);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch (e) {
      // Se ainda falhar, tentar decodificar manualmente
      console.warn('⚠️ atob falhou, tentando decodificação manual');
      return this.decodeBase64Manual(cleaned);
    }
  }

  /**
   * Decodificação base64 manual (fallback)
   */
  private decodeBase64Manual(str: string): Uint8Array {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    const bytes: number[] = [];
    let i = 0;

    str = str.replace(/[^A-Za-z0-9+/=]/g, '');

    while (i < str.length) {
      const encoded1 = chars.indexOf(str.charAt(i++));
      const encoded2 = chars.indexOf(str.charAt(i++));
      const encoded3 = chars.indexOf(str.charAt(i++));
      const encoded4 = chars.indexOf(str.charAt(i++));

      const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;

      bytes.push((bitmap >> 16) & 255);
      if (encoded3 !== 64) bytes.push((bitmap >> 8) & 255);
      if (encoded4 !== 64) bytes.push(bitmap & 255);
    }

    return new Uint8Array(bytes);
  }
  // URL relativa - o proxy do Angular redireciona para localhost:8080
  // Isso evita CORS porque a requisição parece vir da mesma origem
  private readonly grpcWebUrl = '';
  private protoRoot: protobuf.Root | null = null;

  /**
   * Carrega o arquivo .proto usando protobufjs
   */
  private async loadProto(): Promise<protobuf.Root> {
    if (this.protoRoot) {
      return this.protoRoot;
    }

    const protoContent = `
syntax = "proto3";

package items;

message ListarRequest {
  // Pode ficar vazio ou adicionar filtros futuros
}

message Item {
  int32 id = 1;
  string name = 2;
  string description = 3;
  string createdAt = 4;
}

message ListarResponse {
  repeated Item items = 1;
}
`;

    this.protoRoot = protobuf.parse(protoContent, { keepCase: true }).root;
    return this.protoRoot;
  }

  listar(): Promise<GrpcItem[]> {
    return this.listarWithMetrics().then(result => result.items);
  }

  listarWithMetrics(): Promise<{ items: GrpcItem[]; metrics: RequestMetrics }> {
    return new Promise(async (resolve, reject) => {
      try {
        const startTime = performance.now();

        // Carregar proto
        const root = await this.loadProto();
        const ListarResponse = root.lookupType('items.ListarResponse');
        const ListarRequest = root.lookupType('items.ListarRequest');

        // Criar request vazio usando protobufjs
        const requestMessage = ListarRequest.create({});
        const requestBuffer = ListarRequest.encode(requestMessage).finish();
        const requestSize = requestBuffer.length;

        // URL relativa - o proxy do Angular redireciona para localhost:8080
        // Usando /api/grpc como prefixo para o proxy funcionar melhor
        const url = '/api/grpc/items.ItemsService/Listar';

        console.log('🔍 Iniciando chamada gRPC-Web via proxy Angular para:', url);
        console.log('📤 Request size:', requestSize, 'bytes');

        // Criar body no formato grpc-web-text (base64)
        // Formato: [flags (0x00)] [length (4 bytes)] [data]
        const flags = new Uint8Array([0x00]);
        const length = new Uint8Array(4);
        const dataView = new DataView(length.buffer);
        dataView.setUint32(0, requestBuffer.length, false); // Big-endian

        const combined = new Uint8Array(flags.length + length.length + requestBuffer.length);
        combined.set(flags, 0);
        combined.set(length, flags.length);
        combined.set(requestBuffer, flags.length + length.length);

        // Converter para base64
        let binary = '';
        for (let i = 0; i < combined.length; i++) {
          binary += String.fromCharCode(combined[i]);
        }
        const base64Body = btoa(binary);

        // Usar XMLHttpRequest com Content-Type correto
        // Agora podemos usar application/grpc-web-text porque o proxy do Angular
        // redireciona a requisição, então não há CORS (mesma origem)
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/grpc-web-text');
        xhr.setRequestHeader('Accept', 'application/grpc-web-text');
        // Usar 'text' para receber base64 como string
        xhr.responseType = 'text';

        xhr.onload = () => {
          const endTime = performance.now();
          const duration = Math.round(endTime - startTime);

          console.log('📥 XHR Status:', xhr.status);

          if (xhr.status !== 200) {
            reject(new Error(`HTTP error! status: ${xhr.status}`));
            return;
          }

          try {
            // O proxy retorna base64 como texto
            const responseText = (xhr.responseText || xhr.response || '').toString();
            console.log('📥 Response text (first 100 chars):', responseText.substring(0, 100));
            console.log('📥 Response text length:', responseText.length);

            // Usar função robusta de decodificação base64
            const bytes = this.decodeBase64(responseText);
            console.log('✅ Base64 decodificado:', bytes.length, 'bytes');

            console.log('📦 Bytes recebidos:', bytes.length, 'bytes');
            console.log('📦 Primeiros 10 bytes:', Array.from(bytes.slice(0, 10)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));

            // Remover header gRPC-Web (5 primeiros bytes: flags + length)
            let protobufBuffer: Uint8Array;
            if (bytes.length > 5 && bytes[0] === 0x00) {
              // Big-endian: bytes[1-4] = length
              const messageLength = (bytes[1] << 24) | (bytes[2] << 16) | (bytes[3] << 8) | bytes[4];
              console.log('📦 Header gRPC-Web detectado:');
              console.log('   Flags:', bytes[0]);
              console.log('   Message length:', messageLength);
              console.log('   Total buffer:', bytes.length, 'bytes');

              if (bytes.length >= 5 + messageLength) {
                protobufBuffer = bytes.slice(5, 5 + messageLength);
                console.log('✅ Protobuf extraído:', protobufBuffer.length, 'bytes');
              } else {
                console.log('⚠️ Buffer incompleto, usando tudo após header');
                protobufBuffer = bytes.slice(5);
              }
            } else {
              console.log('⚠️ Sem header gRPC-Web (primeiro byte:', bytes[0], '), usando buffer completo');
              protobufBuffer = bytes;
            }

            const protobufSize = protobufBuffer.length;
            console.log('📦 Buffer Protobuf:', protobufSize, 'bytes');

            // Decodificar usando protobufjs
            const message = ListarResponse.decode(protobufBuffer);
            const decoded = ListarResponse.toObject(message, {
              longs: String,
              enums: String,
              bytes: String,
              defaults: true,
              arrays: true,
              objects: true,
              oneofs: true,
            });

            const itemsArray = decoded['items'] as any[];
            const items: GrpcItem[] = (itemsArray || []).map((item: any) => ({
              id: item.id || item['id'],
              name: item.name || item['name'] || '',
              description: item.description || item['description'] || '',
              createdAt: item.createdAt || item['createdAt'] || '',
            }));

            const jsonSize = JSON.stringify(items).length;
            const responseSize = protobufSize;
            const totalSize = requestSize + responseSize;

            const metrics: RequestMetrics = {
              duration,
              requestSize,
              responseSize, // Tamanho real do Protobuf
              totalSize,
            };

            console.log(`📊 gRPC Metrics: Protobuf=${protobufSize}B, JSON=${jsonSize}B, Economia=${jsonSize - protobufSize}B`);

            resolve({ items, metrics });
          } catch (error) {
            console.error('Erro ao decodificar:', error);
            reject(error);
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error'));
        };

        xhr.send(base64Body);
      } catch (error) {
        console.error('Erro ao carregar proto:', error);
        reject(error);
      }
    });
  }
}
