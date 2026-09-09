import { PayrollInput, PayrollResult } from './payroll.model';
import { DEFAULT_TAX_TABLES } from './tax-tables/default-tax-tables';
import { TaxTables } from './tax-tables/tax-tables.model';

/**
 * Calcula o desconto de INSS aplicando a tabela progressiva por faixas
 * (cada faixa é tributada só na parte do salário que está dentro dela),
 * respeitando o teto do salário de contribuição.
 */
export function calculateINSS(grossSalary: number, tables: TaxTables = DEFAULT_TAX_TABLES): number {
  const salary = Math.min(Math.max(grossSalary || 0, 0), tables.inss.ceiling);

  let total = 0;
  let previousLimit = 0;
  for (const bracket of tables.inss.brackets) {
    if (salary <= previousLimit) {
      break;
    }
    const upperLimit = Math.min(salary, bracket.upTo);
    total += (upperLimit - previousLimit) * bracket.rate;
    previousLimit = bracket.upTo;
  }
  return total;
}

/** Aplica a tabela progressiva do IRRF (alíquota da faixa menos a parcela a deduzir) sobre a base de cálculo. */
export function calculateIRRFFromTable(base: number, tables: TaxTables = DEFAULT_TAX_TABLES): number {
  if (base <= 0) {
    return 0;
  }
  const bracket =
    tables.irrf.brackets.find((b) => b.upTo === null || base <= b.upTo) ??
    tables.irrf.brackets[tables.irrf.brackets.length - 1];
  return Math.max(0, base * bracket.rate - bracket.deduction);
}

/**
 * Redutor do IRRF (Lei 15.270/2025): soma-se ao cálculo da tabela
 * tradicional para dar isenção efetiva até `exemptUpTo` e uma redução
 * decrescente até `phaseOutUpTo`. Retorna o valor final do IRRF (após o
 * redutor), nunca negativo.
 */
export function applyIrrfReducer(
  grossSalary: number,
  irrfFromTable: number,
  tables: TaxTables = DEFAULT_TAX_TABLES,
): number {
  const { exemptUpTo, phaseOutUpTo, constant, factor } = tables.irrf.reducer;

  if (grossSalary <= exemptUpTo) {
    return 0;
  }
  if (grossSalary > phaseOutUpTo) {
    return irrfFromTable;
  }
  const reducer = Math.max(0, constant - factor * grossSalary);
  return Math.max(0, irrfFromTable - reducer);
}

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

  const irrfFromTable = calculateIRRFFromTable(irrfBase, tables);
  const irrfDeduction = applyIrrfReducer(grossSalary, irrfFromTable, tables);

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
