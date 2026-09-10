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
  /**
   * INSS sobre as férias — apurado primeiro, de forma independente
   * (`calculateINSS(vacationGross)`), como se fosse a única verba do mês.
   */
  vacationInssDeduction: number;
  /**
   * INSS sobre o salário — apurado depois, pela diferença entre o INSS
   * do total do mês (férias + salário, já respeitando o teto) e o INSS
   * já atribuído às férias acima. Isso garante que a soma das duas
   * partes nunca ultrapasse o teto único de contribuição da competência.
   */
  salaryInssDeduction: number;
  /** INSS total do mês (vacationInssDeduction + salaryInssDeduction), respeitando um único teto de contribuição. */
  inssDeduction: number;
  /** IRRF apurado sobre a parte do salário (dias trabalhados), separado das férias (RIR/2018, art. 625). */
  salaryIrrfDeduction: number;
  /** IRRF apurado sobre a parte das férias (+ 1/3), separado do salário (RIR/2018, art. 625). */
  vacationIrrfDeduction: number;
  /** Total de IRRF do mês (salaryIrrfDeduction + vacationIrrfDeduction). */
  irrfDeduction: number;
  otherDeductions: number;
  /** Férias líquidas (vacationGross - vacationInssDeduction - vacationIrrfDeduction). */
  netVacation: number;
  /** Salário líquido (proportionalSalary - salaryInssDeduction - salaryIrrfDeduction - outros descontos). */
  netSalary: number;
  /** Líquido do mês (netVacation + netSalary). */
  netTotal: number;
  /** 1ª parcela do 13º (50% do salário bruto), sem descontos — só se antecipada. */
  thirteenthAdvance: number;
  /** Total líquido a receber (netTotal + adiantamento do 13º). */
  totalReceivable: number;
  /** Fatias para o gráfico de pizza — só entram itens com valor maior que zero. */
  breakdown: VacationPayrollBreakdownItem[];
}
