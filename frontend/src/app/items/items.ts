import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Item, ItemsService } from './items.service';

@Component({
  selector: 'app-items',
  imports: [DatePipe],
  templateUrl: './items.html',
  styleUrl: './items.scss',
})
export class Items implements OnInit {
  private readonly itemsService = inject(ItemsService);
  protected items: Item[] = [];

  ngOnInit() {
    this.itemsService.getItems().subscribe((items) => {
      this.items = items;
    });
  }
}
