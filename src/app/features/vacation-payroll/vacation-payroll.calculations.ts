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
 * - INSS **efetivamente descontado**: uma única apuração sobre o total
 *   do mês (salário + férias + 1/3), respeitando um único teto de
 *   contribuição — é regime de competência, a Previdência trata as duas
 *   verbas como uma remuneração só.
 * - IRRF: a Receita Federal exige o contrário (RIR/2018, art. 625) — o
 *   imposto sobre férias é retido **separado** do imposto sobre o
 *   salário do mesmo mês, cada um com sua própria tabela progressiva,
 *   seu próprio teto de INSS e sua própria dedução por dependente (que
 *   vale integralmente nos dois cálculos, sem prejuízo). Isso inclui o
 *   próprio INSS usado como dedução de cada base: ele é recalculado de
 *   forma independente para cada parte (regime de caixa, exatamente como
 *   fariam as calculadoras de Salário Líquido e de Férias isoladas) —
 *   não é o INSS único rateado entre as partes. Por isso o INSS
 *   efetivamente descontado do contracheque pode ser diferente da soma
 *   dos INSS usados para calcular cada IRRF.
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

  // INSS efetivamente descontado: uma única apuração sobre o total do
  // mês, respeitando um único teto de contribuição.
  const inssDeduction = calculateINSS(grossTotal, tables);

  // Para o IRRF, o INSS usado como dedução é recalculado de forma
  // independente em cada parte (regime de caixa) — não é rateado a
  // partir do INSS único acima. Isso faz o IRRF de cada parte bater
  // exatamente com o que as calculadoras de Salário Líquido e de Férias
  // isoladas dariam para os mesmos valores.
  const dependentDeduction = dependents * tables.irrf.dependentDeduction;

  const inssForSalaryIrrf = calculateINSS(proportionalSalary, tables);
  const salaryIrrfBase = Math.max(0, proportionalSalary - inssForSalaryIrrf - dependentDeduction);
  const salaryIrrfDeduction = calculateIRRF(proportionalSalary, salaryIrrfBase, tables);

  const inssForVacationIrrf = calculateINSS(vacationGross, tables);
  const vacationIrrfBase = Math.max(0, vacationGross - inssForVacationIrrf - dependentDeduction);
  const vacationIrrfDeduction = calculateIRRF(vacationGross, vacationIrrfBase, tables);

  const irrfDeduction = salaryIrrfDeduction + vacationIrrfDeduction;

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
    salaryIrrfDeduction,
    vacationIrrfDeduction,
    irrfDeduction,
    otherDeductions,
    netTotal,
    thirteenthAdvance,
    totalReceivable,
    breakdown: [
      { label: 'Líquido do mês', value: netTotal },
      { label: 'INSS', value: inssDeduction },
      { label: 'IRRF salário', value: salaryIrrfDeduction },
      { label: 'IRRF férias', value: vacationIrrfDeduction },
      { label: 'Outros descontos', value: otherDeductions },
      { label: 'Adiantamento do 13º', value: thirteenthAdvance },
    ].filter((item) => item.value > 0),
  };
}
