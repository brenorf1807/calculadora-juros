export interface VacationInput {
  grossSalary: number;
  /** Dias de férias a gozar (1 a 30). */
  vacationDays: number;
  dependents: number;
  /** Se o funcionário pediu para adiantar a 1ª parcela do 13º junto com as férias (art. 145 da CLT). */
  anticipateThirteenth: boolean;
}

export interface VacationBreakdownItem {
  label: string;
  value: number;
}

export interface VacationResult {
  /** Valor bruto pelos dias de férias, sem o 1/3 constitucional. */
  vacationPay: number;
  /** 1/3 constitucional sobre os dias de férias. */
  constitutionalBonus: number;
  /** Base tributável de INSS/IRRF (vacationPay + constitutionalBonus). */
  grossVacationTotal: number;
  inssDeduction: number;
  irrfDeduction: number;
  /** Férias líquidas (grossVacationTotal - INSS - IRRF). */
  netVacationPay: number;
  /** 1ª parcela do 13º (50% do salário bruto), sem descontos — só se antecipada. */
  thirteenthAdvance: number;
  /** Total líquido a receber (férias líquidas + adiantamento do 13º). */
  totalReceivable: number;
  /** Fatias para o gráfico de pizza — só entram itens com valor maior que zero. */
  breakdown: VacationBreakdownItem[];
}
