import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Item, ItemsService, RequestMetrics } from './items.service';
import { GrpcItemsService, GrpcItem } from '../grpc/grpc-items.service';

@Component({
  selector: 'app-items',
  imports: [DatePipe],
  templateUrl: './items.html',
  styleUrl: './items.scss',
})
export class Items implements OnInit {
  private readonly itemsService = inject(ItemsService);
  private readonly grpcItemsService = inject(GrpcItemsService);
  protected items: Item[] = [];
  protected itemsGrpc: GrpcItem[] = [];
  protected httpMetrics: RequestMetrics | null = null;
  protected grpcMetrics: RequestMetrics | null = null;
  protected httpLoading = true;
  protected grpcLoading = true;

  // Propriedade computada para vantagem
  get advantage() {
    return this.calculateAdvantage();
  }

  ngOnInit() {
    this.loadHttp();
    this.loadGrpc();
  }

  loadHttp() {
    // Iniciar requisição HTTP
    const startTime = performance.now();
    console.log('🚀 Iniciando requisição HTTP...');
    this.httpLoading = true;

    // Buscar items via HTTP com métricas
    this.itemsService.getItemsWithMetrics().subscribe({
      next: (result) => {
        const endTime = performance.now();
        console.log(`✅ HTTP concluído em ${Math.round(endTime - startTime)}ms`);
        // Limitar a exibição a apenas os 10 primeiros itens
        this.items = result.items.slice(0, 10);
        this.httpMetrics = result.metrics;
        this.httpLoading = false;
      },
      error: (error) => {
        console.error('Erro ao buscar items via HTTP:', error);
        this.httpLoading = false;
      }
    });
  }

  loadGrpc() {
    // Iniciar requisição gRPC
    const startTime = performance.now();
    console.log('🚀 Iniciando requisição gRPC...');
    this.grpcLoading = true;

    // Buscar items via gRPC com métricas
    this.grpcItemsService.listarWithMetrics().then((result) => {
      const endTime = performance.now();
      console.log(`✅ gRPC concluído em ${Math.round(endTime - startTime)}ms`);
      // Limitar a exibição a apenas os 10 primeiros itens
      this.itemsGrpc = result.items.slice(0, 10);
      this.grpcMetrics = result.metrics;
      this.grpcLoading = false;
    }).catch((error) => {
      console.error('Erro ao buscar items via gRPC:', error);
      this.grpcLoading = false;
    });
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  }

  /**
   * Calcula a vantagem percentual do gRPC sobre HTTP
   */
  calculateAdvantage(): {
    sizeAdvantage: number | null;
    timeAdvantage: number | null;
    totalAdvantage: number | null;
  } {
    if (!this.httpMetrics || !this.grpcMetrics) {
      return {
        sizeAdvantage: null,
        timeAdvantage: null,
        totalAdvantage: null,
      };
    }

    // Vantagem de tamanho (economia de bytes)
    const sizeAdvantage = ((this.httpMetrics.responseSize - this.grpcMetrics.responseSize) / this.httpMetrics.responseSize) * 100;

    // Vantagem de tempo (quanto mais rápido)
    const timeAdvantage = ((this.httpMetrics.duration - this.grpcMetrics.duration) / this.httpMetrics.duration) * 100;

    // Vantagem total (economia de bytes totais)
    const totalAdvantage = ((this.httpMetrics.totalSize - this.grpcMetrics.totalSize) / this.httpMetrics.totalSize) * 100;

    return {
      sizeAdvantage: Math.round(sizeAdvantage * 100) / 100, // 2 casas decimais
      timeAdvantage: Math.round(timeAdvantage * 100) / 100,
      totalAdvantage: Math.round(totalAdvantage * 100) / 100,
    };
  }
}
