import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Item, ItemsService } from './items.service';
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

  ngOnInit() {
    // Buscar items via HTTP
    this.itemsService.getItems().subscribe((items) => {
      this.items = items;
    });

    // Buscar items via gRPC
    this.grpcItemsService.listar().then((items) => {
      this.itemsGrpc = items;
    }).catch((error) => {
      console.error('Erro ao buscar items via gRPC:', error);
    });
  }
}
