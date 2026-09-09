import { calculateINSS, calculateIRRF } from '../../core/tax/inss-irrf.calculations';
import { DEFAULT_TAX_TABLES } from '../../core/tax/default-tax-tables';
import { TaxTables } from '../../core/tax/tax-tables.model';
import { VacationPayrollInput, VacationPayrollResult } from './vacation-payroll.model';

const DAYS_IN_MONTH = 30;

/**
 * Função pura de cálculo do mês em que o funcionário sai de férias:
 * salário proporcional aos dias trabalhados + valor das férias + 1/3
 * constitucional, com **INSS e IRRF calculados uma única vez sobre o
 * total do mês** — respeitando um único teto de contribuição do INSS e
 * uma única dedução por dependente do IRRF.
 *
 * Isso é diferente (e mais correto) do que simplesmente somar os
 * resultados das calculadoras de Salário Líquido e de Férias
 * separadamente: cada uma delas aplicaria o teto do INSS e a dedução por
 * dependente de forma independente, o que tende a subestimar os
 * descontos quando o salário já está perto do teto. Não depende do
 * Angular — testável isolada.
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
  const grossTotal = proportionalSalary + vacationPay + constitutionalBonus;

  const inssDeduction = calculateINSS(grossTotal, tables);
  const dependentDeduction = dependents * tables.irrf.dependentDeduction;
  const irrfBase = Math.max(0, grossTotal - inssDeduction - dependentDeduction);
  const irrfDeduction = calculateIRRF(grossTotal, irrfBase, tables);

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
