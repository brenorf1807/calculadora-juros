import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { TaxTablesService } from '../../../core/services/tax-tables.service';
import { nonNegativeValidator, positiveValidator } from '../../../core/validators/number.validators';
import { formatBRL } from '../../../core/utils/currency.util';
import { CurrencyInputComponent } from '../../../shared/ui/currency-input/currency-input';
import { PieChartComponent, PieSlice } from '../../../shared/ui/pie-chart/pie-chart';
import { ResultCardComponent } from '../../../shared/ui/result-card/result-card';
import { ToggleOption, UnitToggleComponent } from '../../../shared/ui/unit-toggle/unit-toggle';
import { calculateTermination } from '../termination.calculations';
import { TerminationInput, TerminationResult } from '../termination.model';

const BREAKDOWN_COLORS: Record<string, string> = {
  'Saldo de salário (líquido)': '#0f766e',
  'Aviso prévio': '#059669',
  '13º proporcional (líquido)': '#15803d',
  'Férias vencidas': '#0891b2',
  'Férias proporcionais': '#0369a1',
  'Multa FGTS': '#6d28d9',
  INSS: '#b45309',
  IRRF: '#be123c',
};

@Component({
  selector: 'app-termination-page',
  imports: [ReactiveFormsModule, CurrencyInputComponent, UnitToggleComponent, ResultCardComponent, PieChartComponent],
  templateUrl: './termination-page.html',
  styleUrl: './termination-page.scss',
})
export class TerminationPage {
  private readonly fb = inject(FormBuilder);
  private readonly taxTablesService = inject(TaxTablesService);

  readonly tablesStatus = this.taxTablesService.status;
  readonly tablesUpdatedAt = computed(() => this.taxTablesService.tables().updatedAt);

  readonly reasonOptions: ToggleOption[] = [
    { value: 'without_cause', label: 'Sem justa causa' },
    { value: 'with_cause', label: 'Justa causa' },
    { value: 'resignation', label: 'Pedido de demissão' },
    { value: 'mutual_agreement', label: 'Acordo (art. 484-A)' },
  ];

  readonly noticeTypeOptions: ToggleOption[] = [
    { value: 'indemnified', label: 'Indenizado' },
    { value: 'worked', label: 'Trabalhado' },
  ];

  readonly form = this.fb.nonNullable.group({
    grossSalary: [3000, [Validators.required, positiveValidator()]],
    reason: ['without_cause'],
    daysWorkedInMonth: [15, [Validators.required, positiveValidator()]],
    monthsWorkedInYear: [6, [nonNegativeValidator()]],
    monthsWorkedInVacationPeriod: [6, [nonNegativeValidator()]],
    hasUnusedVacation: [false],
    yearsOfService: [2, [nonNegativeValidator()]],
    fgtsBalance: [3000, [nonNegativeValidator()]],
    noticeType: ['indemnified'],
    noticeWorkedByEmployee: [true],
    dependents: [0, [nonNegativeValidator()]],
  });

  readonly result = signal<TerminationResult | null>(null);

  /**
   * `FormControl.value` é uma leitura simples, não um signal — um
   * `computed()` que só lesse `form.controls.reason.value` nunca
   * invalidaria quando o usuário trocasse o motivo. `toSignal` observa
   * `valueChanges` de verdade, então os campos condicionais abaixo
   * reagem corretamente.
   */
  private readonly reasonValue = toSignal(this.form.controls.reason.valueChanges, {
    initialValue: this.form.controls.reason.value,
  });

  readonly showNoticeType = computed(() => {
    const reason = this.reasonValue();
    return reason === 'without_cause' || reason === 'mutual_agreement';
  });

  readonly showResignationNotice = computed(() => this.reasonValue() === 'resignation');

  readonly pieSlices = computed<PieSlice[]>(() => {
    const current = this.result();
    if (!current) {
      return [];
    }
    return current.breakdown.map((item) => ({
      label: item.label,
      value: item.value,
      color: BREAKDOWN_COLORS[item.label],
    }));
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.recalculate());
    this.taxTablesService.load().finally(() => this.recalculate());
    this.recalculate();
  }

  formatCurrency(value: number): string {
    return formatBRL(value);
  }

  private recalculate(): void {
    if (this.form.invalid) {
      this.result.set(null);
      return;
    }
    const input = this.form.getRawValue() as unknown as TerminationInput;
    this.result.set(calculateTermination(input, this.taxTablesService.tables()));
  }
}
