import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly navLinks = [
    { path: '/', label: 'Início', exact: true },
    { path: '/juros-compostos', label: 'Juros Compostos', exact: false },
    { path: '/financiamento', label: 'Financiamento', exact: false },
    { path: '/salario', label: 'Salário Líquido', exact: false },
    { path: '/ferias', label: 'Férias', exact: false },
  ];
}
