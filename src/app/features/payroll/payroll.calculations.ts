import { calculateINSS, calculateIRRF } from '../../core/tax/inss-irrf.calculations';
import { DEFAULT_TAX_TABLES } from '../../core/tax/default-tax-tables';
import { TaxTables } from '../../core/tax/tax-tables.model';
import { PayrollInput, PayrollResult } from './payroll.model';

/**
 * Função pura de cálculo do salário líquido: aplica INSS, IRRF (com o
 * redutor da Lei 15.270/2025) e outros descontos informados pelo
 * usuário. Não depende do Angular — as tabelas são passadas como
 * parâmetro (ver `TaxTablesService`), o que a mantém testável isolada.
 */
export function calculatePayroll(input: PayrollInput, tables: TaxTables = DEFAULT_TAX_TABLES): PayrollResult {
  const grossSalary = Math.max(input.grossSalary || 0, 0);
  const dependents = Math.max(0, Math.round(input.dependents || 0));
  const otherDeductions = Math.max(input.otherDeductions || 0, 0);

  const inssDeduction = calculateINSS(grossSalary, tables);
  const dependentDeduction = dependents * tables.irrf.dependentDeduction;
  const irrfBase = Math.max(0, grossSalary - inssDeduction - dependentDeduction);

  const irrfDeduction = calculateIRRF(grossSalary, irrfBase, tables);

  const netSalary = grossSalary - inssDeduction - irrfDeduction - otherDeductions;

  return {
    grossSalary,
    inssDeduction,
    irrfBase,
    irrfDeduction,
    otherDeductions,
    netSalary,
    breakdown: [
      { label: 'Salário líquido', value: netSalary },
      { label: 'INSS', value: inssDeduction },
      { label: 'IRRF', value: irrfDeduction },
      { label: 'Outros descontos', value: otherDeductions },
    ].filter((item) => item.value > 0),
  };
}
