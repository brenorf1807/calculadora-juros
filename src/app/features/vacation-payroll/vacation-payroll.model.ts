export interface VacationPayrollInput {
  grossSalary: number;
  /** Dias de férias a gozar nesse mês (1 a 30) — os demais dias contam como trabalhados. */
  vacationDays: number;
  dependents: number;
  otherDeductions: number;
  /** Se o funcionário pediu para adiantar a 1ª parcela do 13º junto com as férias (art. 145 da CLT). */
  anticipateThirteenth: boolean;
}

export interface VacationPayrollBreakdownItem {
  label: string;
  value: number;
}

export interface VacationPayrollResult {
  workedDays: number;
  /** Salário pelos dias efetivamente trabalhados no mês. */
  proportionalSalary: number;
  /** Valor bruto pelos dias de férias, sem o 1/3. */
  vacationPay: number;
  /** 1/3 constitucional sobre os dias de férias. */
  constitutionalBonus: number;
  /** Base tributável do mês: proportionalSalary + vacationPay + constitutionalBonus. */
  grossTotal: number;
  /** INSS calculado uma única vez sobre `grossTotal`, respeitando um único teto de contribuição. */
  inssDeduction: number;
  /**
   * IRRF apurado separadamente para o salário e para as férias (RIR/2018,
   * art. 625) — este valor é a soma das duas apurações.
   */
  irrfDeduction: number;
  otherDeductions: number;
  /** Líquido do mês (grossTotal - INSS - IRRF - outros descontos). */
  netTotal: number;
  /** 1ª parcela do 13º (50% do salário bruto), sem descontos — só se antecipada. */
  thirteenthAdvance: number;
  /** Total líquido a receber (netTotal + adiantamento do 13º). */
  totalReceivable: number;
  /** Fatias para o gráfico de pizza — só entram itens com valor maior que zero. */
  breakdown: VacationPayrollBreakdownItem[];
}
