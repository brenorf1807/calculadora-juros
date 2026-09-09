export interface PayrollInput {
  grossSalary: number;
  dependents: number;
  otherDeductions: number;
}

export interface PayrollBreakdownItem {
  label: string;
  value: number;
}

export interface PayrollResult {
  grossSalary: number;
  inssDeduction: number;
  irrfBase: number;
  irrfDeduction: number;
  otherDeductions: number;
  netSalary: number;
  /** Fatias para o gráfico de pizza — só entram itens com valor maior que zero. */
  breakdown: PayrollBreakdownItem[];
}
