import { Component, input } from '@angular/core';

import { formatBRL } from '../../../core/utils/currency.util';

export interface ScheduleColumn {
  key: string;
  header: string;
  format?: 'currency' | 'number';
}

/**
 * Tabela genérica de evolução/amortização mês a mês. Recebe colunas e
 * linhas via @Input, podendo ser reaproveitada por qualquer calculadora
 * que precise exibir uma série temporal (juros compostos, financiamento
 * e, futuramente, folha de pagamento).
 */
@Component({
  selector: 'app-schedule-table',
  imports: [],
  templateUrl: './schedule-table.html',
  styleUrl: './schedule-table.scss',
})
export class ScheduleTableComponent {
  readonly columns = input<ScheduleColumn[]>([]);
  readonly rows = input<Record<string, number>[]>([]);

  formatCell(value: number, format: ScheduleColumn['format']): string {
    if (format === 'currency') {
      return formatBRL(value);
    }
    return new Intl.NumberFormat('pt-BR').format(value ?? 0);
  }
}
