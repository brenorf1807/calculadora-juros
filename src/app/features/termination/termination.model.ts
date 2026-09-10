/**
 * Motivo da rescisão. Cobre os 4 tipos mais comuns e bem definidos em
 * lei. Não cobertos (ainda): rescisão indireta, culpa recíproca,
 * término de contrato por prazo determinado, aposentadoria, morte do
 * empregado — cada um tem regras próprias que merecem tratamento
 * dedicado no futuro.
 */
export type TerminationReason = 'without_cause' | 'with_cause' | 'resignation' | 'mutual_agreement';

/** Só se aplica a `without_cause` e `mutual_agreement` (nos demais o aviso segue regra própria). */
export type NoticeType = 'indemnified' | 'worked';

export interface TerminationInput {
  grossSalary: number;
  reason: TerminationReason;
  /** Dias trabalhados no mês da rescisão (para o saldo de salário), 1-30. */
  daysWorkedInMonth: number;
  /** Meses trabalhados no ano corrente (para o 13º proporcional), 0-12. */
  monthsWorkedInYear: number;
  /** Meses no período aquisitivo atual de férias (para férias proporcionais), 0-12. */
  monthsWorkedInVacationPeriod: number;
  /** Se há férias vencidas (período aquisitivo anterior completo) não gozadas. */
  hasUnusedVacation: boolean;
  /** Anos completos de casa — usado no aviso prévio proporcional (Lei 12.506/2011). */
  yearsOfService: number;
  /** Saldo total depositado no FGTS — base para a multa rescisória. */
  fgtsBalance: number;
  /** Só relevante para `without_cause` e `mutual_agreement`. */
  noticeType: NoticeType;
  /** Só relevante para `resignation`: se o empregado cumpriu o aviso prévio. */
  noticeWorkedByEmployee: boolean;
  dependents: number;
}

export interface TerminationBreakdownItem {
  label: string;
  value: number;
}

export interface TerminationResult {
  /** Dias de aviso prévio (30 + 3 por ano após o 1º, até 90) — 0 quando não cabe aviso prévio indenizado. */
  noticeDays: number;

  balanceSalary: number;
  noticeAmount: number;
  /** Desconto por aviso prévio não cumprido pelo empregado (só em `resignation`), valor positivo a subtrair. */
  noticeDiscount: number;
  thirteenthSalary: number;
  unusedVacation: number;
  proportionalVacation: number;
  fgtsFine: number;

  /** Soma de todas as verbas (antes de descontos de INSS/IRRF/aviso não cumprido). */
  grossTotal: number;

  balanceSalaryInss: number;
  balanceSalaryIrrf: number;
  thirteenthInss: number;
  thirteenthIrrf: number;

  totalInss: number;
  totalIrrf: number;

  /** Total líquido a receber. */
  netTotal: number;

  breakdown: TerminationBreakdownItem[];
}
