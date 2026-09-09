import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { nonNegativeValidator, positiveValidator } from '../../../core/validators/number.validators';
import { formatBRL } from '../../../core/utils/currency.util';
import { CurrencyInputComponent } from '../../../shared/ui/currency-input/currency-input';
import { PercentInputComponent } from '../../../shared/ui/percent-input/percent-input';
import { ResultCardComponent } from '../../../shared/ui/result-card/result-card';
import { ScheduleColumn, ScheduleTableComponent } from '../../../shared/ui/schedule-table/schedule-table';
import { ToggleOption, UnitToggleComponent } from '../../../shared/ui/unit-toggle/unit-toggle';
import { calculateFinancingPrice, calculateFinancingSAC } from '../financing.calculations';
import { FinancingInput, FinancingResult } from '../financing.model';

@Component({
  selector: 'app-financing-page',
  imports: [
    ReactiveFormsModule,
    CurrencyInputComponent,
    PercentInputComponent,
    UnitToggleComponent,
    ResultCardComponent,
    ScheduleTableComponent,
  ],
  templateUrl: './financing-page.html',
  styleUrl: './financing-page.scss',
})
export class FinancingPage {
  private readonly fb = inject(FormBuilder);

  readonly rateTypeOptions: ToggleOption[] = [
    { value: 'monthly', label: 'Mensal' },
    { value: 'annual', label: 'Anual' },
  ];

  readonly systemOptions: ToggleOption[] = [
    { value: 'price', label: 'Tabela Price' },
    { value: 'sac', label: 'SAC' },
  ];

  readonly tableColumns: ScheduleColumn[] = [
    { key: 'number', header: 'Parcela', format: 'number' },
    { key: 'payment', header: 'Valor da parcela', format: 'currency' },
    { key: 'interest', header: 'Juros', format: 'currency' },
    { key: 'amortization', header: 'Amortização', format: 'currency' },
    { key: 'balance', header: 'Saldo devedor', format: 'currency' },
  ];

  readonly form = this.fb.nonNullable.group({
    financedAmount: [50000, [nonNegativeValidator()]],
    interestRate: [1.5, [Validators.required, positiveValidator()]],
    rateType: ['monthly'],
    installments: [48, [Validators.required, positiveValidator()]],
    amortizationSystem: ['price'],
  });

  readonly result = signal<FinancingResult | null>(null);

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.recalculate());
    this.recalculate();
  }

  formatCurrency(value: number): string {
    return formatBRL(value);
  }

  installmentLabel(system: string): string {
    return system === 'sac' ? 'Valor da 1ª parcela' : 'Valor da parcela';
  }

  private recalculate(): void {
    if (this.form.invalid) {
      this.result.set(null);
      return;
    }
    const { amortizationSystem, ...rest } = this.form.getRawValue();
    const input = rest as unknown as FinancingInput;
    const calculate =
      amortizationSystem === 'sac' ? calculateFinancingSAC : calculateFinancingPrice;
    this.result.set(calculate(input));
  }
}
