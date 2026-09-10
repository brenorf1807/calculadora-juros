import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { TaxTablesService } from '../../../core/services/tax-tables.service';
import { nonNegativeValidator, positiveValidator } from '../../../core/validators/number.validators';
import { formatBRL } from '../../../core/utils/currency.util';
import { CurrencyInputComponent } from '../../../shared/ui/currency-input/currency-input';
import { PieChartComponent, PieSlice } from '../../../shared/ui/pie-chart/pie-chart';
import { ResultCardComponent } from '../../../shared/ui/result-card/result-card';
import { calculateVacationPayroll } from '../vacation-payroll.calculations';
import { VacationPayrollInput, VacationPayrollResult } from '../vacation-payroll.model';

const BREAKDOWN_COLORS: Record<string, string> = {
  'Líquido do mês': '#0f766e',
  INSS: '#b45309',
  'IRRF salário': '#be123c',
  'IRRF férias': '#e11d48',
  'Outros descontos': '#0369a1',
  'Adiantamento do 13º': '#6d28d9',
};

@Component({
  selector: 'app-vacation-payroll-page',
  imports: [ReactiveFormsModule, CurrencyInputComponent, ResultCardComponent, PieChartComponent],
  templateUrl: './vacation-payroll-page.html',
  styleUrl: './vacation-payroll-page.scss',
})
export class VacationPayrollPage {
  private readonly fb = inject(FormBuilder);
  private readonly taxTablesService = inject(TaxTablesService);

  readonly tablesStatus = this.taxTablesService.status;
  readonly tablesUpdatedAt = computed(() => this.taxTablesService.tables().updatedAt);

  readonly form = this.fb.nonNullable.group({
    grossSalary: [5000, [Validators.required, positiveValidator()]],
    vacationDays: [30, [Validators.required, positiveValidator()]],
    dependents: [0, [nonNegativeValidator()]],
    otherDeductions: [0, [nonNegativeValidator()]],
    anticipateThirteenth: [false],
  });

  readonly result = signal<VacationPayrollResult | null>(null);

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
    const input = this.form.getRawValue() as unknown as VacationPayrollInput;
    this.result.set(calculateVacationPayroll(input, this.taxTablesService.tables()));
  }
}
