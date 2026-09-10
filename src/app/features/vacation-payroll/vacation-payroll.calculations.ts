import { calculateINSS, calculateIRRF } from '../../core/tax/inss-irrf.calculations';
import { DEFAULT_TAX_TABLES } from '../../core/tax/default-tax-tables';
import { TaxTables } from '../../core/tax/tax-tables.model';
import { VacationPayrollInput, VacationPayrollResult } from './vacation-payroll.model';

const DAYS_IN_MONTH = 30;

/**
 * Função pura de cálculo do mês em que o funcionário sai de férias:
 * salário proporcional aos dias trabalhados + valor das férias + 1/3
 * constitucional.
 *
 * INSS e IRRF seguem regras diferentes aqui, e é importante não
 * confundi-las:
 * - INSS: calculado uma única vez sobre o total do mês (salário +
 *   férias + 1/3), respeitando um único teto de contribuição — é
 *   regime de competência, a Previdência trata as duas verbas como uma
 *   remuneração só.
 * - IRRF: a Receita Federal exige o contrário (RIR/2018, art. 625) — o
 *   imposto sobre férias é retido **separado** do imposto sobre o
 *   salário do mesmo mês, cada um com sua própria tabela progressiva e
 *   sua própria dedução por dependente (a dedução vale integralmente
 *   nos dois cálculos, sem prejuízo). Para isso, o INSS total (já
 *   calculado uma vez) é rateado proporcionalmente entre as duas partes
 *   antes de apurar a base de cada IRRF.
 *
 * Não depende do Angular — testável isolada.
 */
export function calculateVacationPayroll(
  input: VacationPayrollInput,
  tables: TaxTables = DEFAULT_TAX_TABLES,
): VacationPayrollResult {
  const grossSalary = Math.max(input.grossSalary || 0, 0);
  const vacationDays = Math.min(Math.max(Math.round(input.vacationDays || 0), 0), DAYS_IN_MONTH);
  const workedDays = DAYS_IN_MONTH - vacationDays;
  const dependents = Math.max(0, Math.round(input.dependents || 0));
  const otherDeductions = Math.max(input.otherDeductions || 0, 0);

  const dailyRate = grossSalary / DAYS_IN_MONTH;
  const proportionalSalary = dailyRate * workedDays;
  const vacationPay = dailyRate * vacationDays;
  const constitutionalBonus = vacationPay / 3;
  const vacationGross = vacationPay + constitutionalBonus;
  const grossTotal = proportionalSalary + vacationGross;

  // INSS: uma única apuração sobre o total do mês, respeitando um único teto.
  const inssDeduction = calculateINSS(grossTotal, tables);

  // Rateia o INSS proporcionalmente entre salário e férias, para then
  // apurar a base de cada IRRF separadamente (a Receita Federal proíbe
  // somar as duas bases — RIR/2018, art. 625).
  const salaryShare = grossTotal > 0 ? proportionalSalary / grossTotal : 0;
  const inssOnSalary = inssDeduction * salaryShare;
  const inssOnVacation = inssDeduction - inssOnSalary;

  const dependentDeduction = dependents * tables.irrf.dependentDeduction;

  const salaryIrrfBase = Math.max(0, proportionalSalary - inssOnSalary - dependentDeduction);
  const salaryIrrf = calculateIRRF(proportionalSalary, salaryIrrfBase, tables);

  const vacationIrrfBase = Math.max(0, vacationGross - inssOnVacation - dependentDeduction);
  const vacationIrrf = calculateIRRF(vacationGross, vacationIrrfBase, tables);

  const irrfDeduction = salaryIrrf + vacationIrrf;

  const netTotal = grossTotal - inssDeduction - irrfDeduction - otherDeductions;
  const thirteenthAdvance = input.anticipateThirteenth ? grossSalary * 0.5 : 0;
  const totalReceivable = netTotal + thirteenthAdvance;

  return {
    workedDays,
    proportionalSalary,
    vacationPay,
    constitutionalBonus,
    grossTotal,
    inssDeduction,
    irrfDeduction,
    otherDeductions,
    netTotal,
    thirteenthAdvance,
    totalReceivable,
    breakdown: [
      { label: 'Líquido do mês', value: netTotal },
      { label: 'INSS', value: inssDeduction },
      { label: 'IRRF', value: irrfDeduction },
      { label: 'Outros descontos', value: otherDeductions },
      { label: 'Adiantamento do 13º', value: thirteenthAdvance },
    ].filter((item) => item.value > 0),
  };
}
