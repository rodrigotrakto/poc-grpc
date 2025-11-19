import { HttpClient } from '@angular/common/http';
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

@Injectable({
  providedIn: 'root',
})
export class ItemsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:9000';

  getItems(): Observable<Item[]> {
    return this.http
      .get<ItemsResponse>(`${this.apiUrl}/items`)
      .pipe(map((response) => response.items));
  }
}
