import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface Item {
  id: number;
  name: string;
  description?: string;
  createdAt?: Date;
}

interface ItemsResponse {
  items: Item[];
}

export interface RequestMetrics {
  duration: number;
  requestSize: number;
  responseSize: number;
  totalSize: number;
}

@Injectable({
  providedIn: 'root',
})
export class ItemsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:9000';

  getItems(): Observable<Item[]> {
    return this.getItemsWithMetrics().pipe(map((result) => result.items));
  }

  getItemsWithMetrics(): Observable<{ items: Item[]; metrics: RequestMetrics }> {
    const startTime = performance.now();

    // Calcular tamanho da requisição (URL + headers)
    const url = `${this.apiUrl}/items`;
    const requestHeaders = new HttpHeaders();
    const requestSize = this.calculateRequestSize('GET', url, requestHeaders);

    return this.http
      .get<ItemsResponse>(url, {
        observe: 'response',
        headers: requestHeaders,
      })
      .pipe(
        map((response) => {
          const endTime = performance.now();
          const duration = Math.round(endTime - startTime);

          // Calcular tamanho da resposta
          const responseBody = response.body || {};
          const responseSize = JSON.stringify(responseBody).length;

          // Obter métricas dos headers do servidor (se disponíveis)
          const serverRequestSize = parseInt(response.headers.get('X-Request-Size') || '0', 10);
          const serverResponseSize = parseInt(response.headers.get('X-Response-Size') || '0', 10);
          const serverTotalSize = parseInt(response.headers.get('X-Total-Size') || '0', 10);

          // Usar valores do servidor se disponíveis, senão usar valores calculados
          const finalRequestSize = serverRequestSize > 0 ? serverRequestSize : requestSize;
          const finalResponseSize = serverResponseSize > 0 ? serverResponseSize : responseSize;
          const finalTotalSize =
            serverTotalSize > 0 ? serverTotalSize : finalRequestSize + finalResponseSize;

          const metrics: RequestMetrics = {
            duration: duration,
            requestSize: finalRequestSize,
            responseSize: finalResponseSize,
            totalSize: finalTotalSize,
          };

          return {
            items: response.body?.items || [],
            metrics,
          };
        })
      );
  }

  /**
   * Calcula o tamanho aproximado da requisição HTTP
   */
  private calculateRequestSize(method: string, url: string, headers: HttpHeaders): number {
    // Tamanho do método + URL + versão HTTP
    let size = method.length + 1 + url.length + 11; // "GET /path HTTP/1.1\r\n"

    // Tamanho dos headers
    headers.keys().forEach((key) => {
      const value = headers.get(key) || '';
      size += key.length + 2 + value.length + 2; // "Key: Value\r\n"
    });

    // Tamanho do body (se houver) - para GET não há body
    // Adicionar tamanho mínimo de headers HTTP padrão
    size += 50; // Headers padrão (Host, User-Agent, Accept, etc.)

    return size;
  }
}
