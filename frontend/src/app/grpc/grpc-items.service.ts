import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface GrpcItem {
  id: number;
  name: string;
  description: string;
  createdAt: string;
}

interface ListarResponse {
  items: GrpcItem[];
}

@Injectable({
  providedIn: 'root',
})
export class GrpcItemsService {
  private readonly http = inject(HttpClient);
  // Endpoint HTTP que faz ponte para o gRPC
  // O backend tem um endpoint /listar que chama o gRPC internamente
  private readonly apiUrl = 'http://localhost:9000';

  listar(): Promise<GrpcItem[]> {
    return new Promise((resolve, reject) => {
      // Chamar o endpoint HTTP que faz ponte para o gRPC
      this.http.post<ListarResponse>(`${this.apiUrl}/listar`, {}).subscribe({
        next: (response) => {
          resolve(response.items || []);
        },
        error: (error) => {
          console.error('Erro ao buscar items via gRPC:', error);
          reject(error);
        },
      });
    });
  }
}

