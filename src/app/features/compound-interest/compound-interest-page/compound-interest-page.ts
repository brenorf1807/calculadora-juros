import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { nonNegativeValidator, positiveValidator } from '../../../core/validators/number.validators';
import { formatBRL } from '../../../core/utils/currency.util';
import { BalanceChartComponent, ChartPoint } from '../../../shared/ui/balance-chart/balance-chart';
import { CurrencyInputComponent } from '../../../shared/ui/currency-input/currency-input';
import { PercentInputComponent } from '../../../shared/ui/percent-input/percent-input';
import { ResultCardComponent } from '../../../shared/ui/result-card/result-card';
import { ScheduleColumn, ScheduleTableComponent } from '../../../shared/ui/schedule-table/schedule-table';
import { ToggleOption, UnitToggleComponent } from '../../../shared/ui/unit-toggle/unit-toggle';
import { calculateCompoundInterest } from '../compound-interest.calculations';
import { CompoundInterestInput, CompoundInterestResult } from '../compound-interest.model';

@Component({
  selector: 'app-compound-interest-page',
  imports: [
    ReactiveFormsModule,
    CurrencyInputComponent,
    PercentInputComponent,
    UnitToggleComponent,
    ResultCardComponent,
    ScheduleTableComponent,
    BalanceChartComponent,
  ],
  templateUrl: './compound-interest-page.html',
  styleUrl: './compound-interest-page.scss',
})
export class CompoundInterestPage {
  private readonly fb = inject(FormBuilder);

  readonly rateTypeOptions: ToggleOption[] = [
    { value: 'monthly', label: 'Mensal' },
    { value: 'annual', label: 'Anual' },
  ];

  readonly termUnitOptions: ToggleOption[] = [
    { value: 'months', label: 'Meses' },
    { value: 'years', label: 'Anos' },
  ];

  readonly tableColumns: ScheduleColumn[] = [
    { key: 'period', header: 'Mês', format: 'number' },
    { key: 'contribution', header: 'Aporte', format: 'currency' },
    { key: 'interest', header: 'Juros', format: 'currency' },
    { key: 'balance', header: 'Saldo', format: 'currency' },
  ];

  readonly form = this.fb.nonNullable.group({
    initialValue: [1000, [nonNegativeValidator()]],
    monthlyContribution: [200, [nonNegativeValidator()]],
    interestRate: [1, [Validators.required, positiveValidator()]],
    rateType: ['monthly'],
    term: [12, [Validators.required, positiveValidator()]],
    termUnit: ['months'],
  });

  readonly result = signal<CompoundInterestResult | null>(null);

  readonly chartPoints = computed<ChartPoint[]>(() => {
    const current = this.result();
    if (!current) {
      return [];
    }
    return current.schedule.map((row) => ({ label: `${row.period}`, value: row.balance }));
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.recalculate());
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
    const input = this.form.getRawValue() as unknown as CompoundInterestInput;
    this.result.set(calculateCompoundInterest(input));
  }
}
