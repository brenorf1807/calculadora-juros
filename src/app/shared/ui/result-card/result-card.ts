import { Component, input } from '@angular/core';

/** Card de destaque para um resultado numérico (ex.: valor total acumulado). */
@Component({
  selector: 'app-result-card',
  imports: [],
  templateUrl: './result-card.html',
  styleUrl: './result-card.scss',
})
export class ResultCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly highlight = input(false);
}
