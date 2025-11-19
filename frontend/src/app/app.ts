import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Items } from './items/items';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Items],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('frontend');
}
