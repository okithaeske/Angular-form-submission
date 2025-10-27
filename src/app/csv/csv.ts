import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-csv',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './csv.html',
  styleUrl: './csv.scss'
})
export class Csv {
  onFileSelected($event: Event) {
    throw new Error('Method not implemented.');
  }
}