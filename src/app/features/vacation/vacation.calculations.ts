import { calculateINSS, calculateIRRF } from '../../core/tax/inss-irrf.calculations';
import { DEFAULT_TAX_TABLES } from '../../core/tax/default-tax-tables';
import { TaxTables } from '../../core/tax/tax-tables.model';
import { VacationInput, VacationResult } from './vacation.model';

const MAX_VACATION_DAYS = 30;

/**
 * Função pura de cálculo de férias: valor dos dias gozados + 1/3
 * constitucional, com INSS e IRRF aplicados sobre esse total (mesmas
 * tabelas do salário mensal — ver `core/tax`), e a 1ª parcela do 13º
 * salário quando antecipada junto com as férias (art. 145 da CLT: 50% do
 * salário, sem descontos). Não depende do Angular — testável isolada.
 */
export function calculateVacation(input: VacationInput, tables: TaxTables = DEFAULT_TAX_TABLES): VacationResult {
  const grossSalary = Math.max(input.grossSalary || 0, 0);
  const vacationDays = Math.min(Math.max(Math.round(input.vacationDays || 0), 0), MAX_VACATION_DAYS);
  const dependents = Math.max(0, Math.round(input.dependents || 0));

  const dailyRate = grossSalary / MAX_VACATION_DAYS;
  const vacationPay = dailyRate * vacationDays;
  const constitutionalBonus = vacationPay / 3;
  const grossVacationTotal = vacationPay + constitutionalBonus;

  const inssDeduction = calculateINSS(grossVacationTotal, tables);
  const dependentDeduction = dependents * tables.irrf.dependentDeduction;
  const irrfBase = Math.max(0, grossVacationTotal - inssDeduction - dependentDeduction);
  const irrfDeduction = calculateIRRF(grossVacationTotal, irrfBase, tables);

  const netVacationPay = grossVacationTotal - inssDeduction - irrfDeduction;
  const thirteenthAdvance = input.anticipateThirteenth ? grossSalary * 0.5 : 0;
  const totalReceivable = netVacationPay + thirteenthAdvance;

  return {
    vacationPay,
    constitutionalBonus,
    grossVacationTotal,
    inssDeduction,
    irrfDeduction,
    netVacationPay,
    thirteenthAdvance,
    totalReceivable,
    breakdown: [
      { label: 'Férias líquidas', value: netVacationPay },
      { label: 'INSS', value: inssDeduction },
      { label: 'IRRF', value: irrfDeduction },
      { label: 'Adiantamento do 13º', value: thirteenthAdvance },
    ].filter((item) => item.value > 0),
  };
}
