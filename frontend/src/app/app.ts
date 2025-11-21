import { Component, signal } from '@angular/core';
import { Items } from './items/items';

@Component({
  selector: 'app-root',
  imports: [Items],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('frontend');
}
