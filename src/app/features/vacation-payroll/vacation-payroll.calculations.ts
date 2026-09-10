import { calculateINSS, calculateIRRF } from '../../core/tax/inss-irrf.calculations';
import { DEFAULT_TAX_TABLES } from '../../core/tax/default-tax-tables';
import { TaxTables } from '../../core/tax/tax-tables.model';
import { VacationPayrollInput, VacationPayrollResult } from './vacation-payroll.model';

const DAYS_IN_MONTH = 30;

/**
 * Função pura de cálculo do mês em que o funcionário sai de férias:
 * salário proporcional aos dias trabalhados + valor das férias + 1/3
 * constitucional, com férias e salário líquidos calculados e exibidos
 * separadamente.
 *
 * INSS e IRRF seguem regras diferentes aqui, e é importante não
 * confundi-las:
 * - **INSS**: regime de competência — um único teto de contribuição para
 *   o mês inteiro (férias + salário). Para dividir esse total entre as
 *   duas partes, calculamos primeiro o INSS das férias de forma
 *   independente (como se fossem a única remuneração do mês) e, depois,
 *   o INSS do salário pela diferença entre o INSS do total acumulado
 *   (férias + salário, já respeitando o teto) e o INSS já atribuído às
 *   férias. Isso garante que a soma das duas partes nunca ultrapasse o
 *   teto único — diferente de simplesmente ratear o total por percentual.
 * - **IRRF**: a Receita Federal exige o contrário (RIR/2018, art. 625) —
 *   o imposto sobre férias é retido separado do imposto sobre o salário
 *   do mesmo mês, cada um com sua própria tabela progressiva e sua
 *   própria dedução por dependente (que vale integralmente nos dois
 *   cálculos). Para isso, o IRRF de cada parte usa o INSS **calculado de
 *   forma independente sobre aquela parte** como dedução (não o INSS
 *   incremental acima) — é assim que o IRRF de cada parte bate
 *   exatamente com o que as calculadoras de Salário Líquido e de Férias
 *   isoladas dariam para os mesmos valores.
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

  // INSS efetivamente descontado: as férias entram primeiro (de forma
  // independente) e o salário fica com a diferença até o teto do total
  // acumulado — nunca ultrapassando o teto único da competência.
  const vacationInssDeduction = calculateINSS(vacationGross, tables);
  const salaryInssDeduction = Math.max(0, calculateINSS(grossTotal, tables) - vacationInssDeduction);
  const inssDeduction = vacationInssDeduction + salaryInssDeduction;

  // Para o IRRF, o INSS usado como dedução é recalculado de forma
  // independente em cada parte (regime de caixa) — não é o INSS
  // incremental acima. Isso faz o IRRF de cada parte bater exatamente
  // com o que as calculadoras de Salário Líquido e de Férias isoladas
  // dariam para os mesmos valores.
  const dependentDeduction = dependents * tables.irrf.dependentDeduction;

  const inssForSalaryIrrf = calculateINSS(proportionalSalary, tables);
  const salaryIrrfBase = Math.max(0, proportionalSalary - inssForSalaryIrrf - dependentDeduction);
  const salaryIrrfDeduction = calculateIRRF(proportionalSalary, salaryIrrfBase, tables);

  const inssForVacationIrrf = calculateINSS(vacationGross, tables);
  const vacationIrrfBase = Math.max(0, vacationGross - inssForVacationIrrf - dependentDeduction);
  const vacationIrrfDeduction = calculateIRRF(vacationGross, vacationIrrfBase, tables);

  const irrfDeduction = salaryIrrfDeduction + vacationIrrfDeduction;

  const netVacation = vacationGross - vacationInssDeduction - vacationIrrfDeduction;
  const netSalary = proportionalSalary - salaryInssDeduction - salaryIrrfDeduction - otherDeductions;
  const netTotal = netVacation + netSalary;

  const thirteenthAdvance = input.anticipateThirteenth ? grossSalary * 0.5 : 0;
  const totalReceivable = netTotal + thirteenthAdvance;

  return {
    workedDays,
    proportionalSalary,
    vacationPay,
    constitutionalBonus,
    grossTotal,
    vacationInssDeduction,
    salaryInssDeduction,
    inssDeduction,
    salaryIrrfDeduction,
    vacationIrrfDeduction,
    irrfDeduction,
    otherDeductions,
    netVacation,
    netSalary,
    netTotal,
    thirteenthAdvance,
    totalReceivable,
    breakdown: [
      { label: 'Líquido férias', value: netVacation },
      { label: 'Líquido salário', value: netSalary },
      { label: 'INSS férias', value: vacationInssDeduction },
      { label: 'INSS salário', value: salaryInssDeduction },
      { label: 'IRRF salário', value: salaryIrrfDeduction },
      { label: 'IRRF férias', value: vacationIrrfDeduction },
      { label: 'Outros descontos', value: otherDeductions },
      { label: 'Adiantamento do 13º', value: thirteenthAdvance },
    ].filter((item) => item.value > 0),
  };
}
