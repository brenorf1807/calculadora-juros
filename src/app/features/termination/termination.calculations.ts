import { calculateINSS, calculateIRRF } from '../../core/tax/inss-irrf.calculations';
import { DEFAULT_TAX_TABLES } from '../../core/tax/default-tax-tables';
import { TaxTables } from '../../core/tax/tax-tables.model';
import { TerminationInput, TerminationResult } from './termination.model';

const DAYS_IN_MONTH = 30;
const BASE_NOTICE_DAYS = 30;
const MAX_NOTICE_EXTRA_DAYS = 60;

/**
 * Aviso prévio proporcional (Lei 12.506/2011): 30 dias para até 1 ano de
 * serviço, mais 3 dias por ano completo além do primeiro, até o máximo
 * de 60 dias extras (90 dias no total).
 */
function calculateNoticeDays(yearsOfService: number): number {
  const fullYears = Math.max(0, Math.floor(yearsOfService));
  const extraDays = Math.min(MAX_NOTICE_EXTRA_DAYS, Math.max(0, fullYears - 1) * 3);
  return BASE_NOTICE_DAYS + extraDays;
}

/**
 * Função pura de cálculo de rescisão trabalhista. Cobre 4 motivos:
 * dispensa sem justa causa, dispensa por justa causa, pedido de
 * demissão e rescisão por acordo entre as partes (art. 484-A da CLT).
 *
 * Tratamento tributário (INSS/IRRF), reaproveitando as mesmas funções
 * puras usadas pelo resto da app:
 * - Saldo de salário e 13º proporcional são tributáveis — cada um
 *   apurado de forma independente (mesmo padrão já usado para separar
 *   férias e salário no "Mês de Férias").
 * - Aviso prévio indenizado, férias indenizadas (vencidas e
 *   proporcionais, com o 1/3) e a multa do FGTS são isentos de INSS e
 *   IRRF — têm natureza indenizatória (Lei 7.713/1988, art. 6º, V; e
 *   Decreto 3.048/1999, art. 214, §9º).
 *
 * Não depende do Angular — testável isolada.
 */
export function calculateTermination(
  input: TerminationInput,
  tables: TaxTables = DEFAULT_TAX_TABLES,
): TerminationResult {
  const grossSalary = Math.max(input.grossSalary || 0, 0);
  const dailyRate = grossSalary / DAYS_IN_MONTH;
  const monthlyRate = grossSalary / 12;
  const dependents = Math.max(0, Math.round(input.dependents || 0));
  const dependentDeduction = dependents * tables.irrf.dependentDeduction;

  const daysWorkedInMonth = Math.min(DAYS_IN_MONTH, Math.max(0, Math.round(input.daysWorkedInMonth || 0)));
  const monthsWorkedInYear = Math.min(12, Math.max(0, Math.round(input.monthsWorkedInYear || 0)));
  const monthsWorkedInVacationPeriod = Math.min(
    12,
    Math.max(0, Math.round(input.monthsWorkedInVacationPeriod || 0)),
  );
  const yearsOfService = Math.max(0, input.yearsOfService || 0);
  const fgtsBalance = Math.max(0, input.fgtsBalance || 0);
  const reason = input.reason;

  const hasNoticeRight = reason === 'without_cause' || reason === 'mutual_agreement';
  const noticeDays = hasNoticeRight ? calculateNoticeDays(yearsOfService) : 0;
  const noticeIndemnified = hasNoticeRight && input.noticeType === 'indemnified';

  // Saldo de salário: sempre devido, qualquer que seja o motivo.
  const balanceSalary = dailyRate * daysWorkedInMonth;

  // Aviso prévio.
  let noticeAmount = 0;
  let noticeDiscount = 0;
  if (reason === 'without_cause') {
    noticeAmount = noticeIndemnified ? dailyRate * noticeDays : 0;
  } else if (reason === 'mutual_agreement') {
    // Art. 484-A da CLT: aviso prévio indenizado pago pela metade.
    noticeAmount = noticeIndemnified ? (dailyRate * noticeDays) / 2 : 0;
  } else if (reason === 'resignation' && !input.noticeWorkedByEmployee) {
    // O empregado não cumpriu o aviso e o empregador desconta 30 dias.
    noticeDiscount = grossSalary;
  }

  // Projeção do aviso prévio indenizado: os dias de aviso contam como
  // tempo de serviço para o 13º e as férias proporcionais (art. 487,
  // §1º da CLT).
  const projectedMonths = noticeIndemnified ? noticeDays / DAYS_IN_MONTH : 0;

  // 13º salário proporcional — não devido na dispensa por justa causa.
  const thirteenthMonths = reason === 'with_cause' ? 0 : Math.min(12, monthsWorkedInYear + projectedMonths);
  const thirteenthSalary = monthlyRate * thirteenthMonths;

  // Férias vencidas — direito adquirido, devido em qualquer motivo se houver período completo não gozado.
  const unusedVacation = input.hasUnusedVacation ? grossSalary * (4 / 3) : 0;

  // Férias proporcionais — não devidas na dispensa por justa causa.
  const vacationMonths =
    reason === 'with_cause' ? 0 : Math.min(12, monthsWorkedInVacationPeriod + projectedMonths);
  const proportionalVacation = monthlyRate * vacationMonths * (4 / 3);

  // Multa do FGTS: 40% na dispensa sem justa causa, 20% no acordo (art. 484-A), 0% nos demais.
  const fgtsFineRate = reason === 'without_cause' ? 0.4 : reason === 'mutual_agreement' ? 0.2 : 0;
  const fgtsFine = fgtsBalance * fgtsFineRate;

  const grossTotal =
    balanceSalary + noticeAmount + thirteenthSalary + unusedVacation + proportionalVacation + fgtsFine;

  const balanceSalaryInss = calculateINSS(balanceSalary, tables);
  const balanceSalaryIrrfBase = Math.max(0, balanceSalary - balanceSalaryInss - dependentDeduction);
  const balanceSalaryIrrf = calculateIRRF(balanceSalary, balanceSalaryIrrfBase, tables);

  const thirteenthInss = calculateINSS(thirteenthSalary, tables);
  const thirteenthIrrfBase = Math.max(0, thirteenthSalary - thirteenthInss - dependentDeduction);
  const thirteenthIrrf = calculateIRRF(thirteenthSalary, thirteenthIrrfBase, tables);

  const totalInss = balanceSalaryInss + thirteenthInss;
  const totalIrrf = balanceSalaryIrrf + thirteenthIrrf;

  const netTotal = grossTotal - totalInss - totalIrrf - noticeDiscount;

  return {
    noticeDays,
    balanceSalary,
    noticeAmount,
    noticeDiscount,
    thirteenthSalary,
    unusedVacation,
    proportionalVacation,
    fgtsFine,
    grossTotal,
    balanceSalaryInss,
    balanceSalaryIrrf,
    thirteenthInss,
    thirteenthIrrf,
    totalInss,
    totalIrrf,
    netTotal,
    breakdown: [
      { label: 'Saldo de salário (líquido)', value: balanceSalary - balanceSalaryInss - balanceSalaryIrrf },
      { label: 'Aviso prévio', value: noticeAmount },
      { label: '13º proporcional (líquido)', value: thirteenthSalary - thirteenthInss - thirteenthIrrf },
      { label: 'Férias vencidas', value: unusedVacation },
      { label: 'Férias proporcionais', value: proportionalVacation },
      { label: 'Multa FGTS', value: fgtsFine },
      { label: 'INSS', value: totalInss },
      { label: 'IRRF', value: totalIrrf },
    ].filter((item) => item.value > 0),
  };
}
