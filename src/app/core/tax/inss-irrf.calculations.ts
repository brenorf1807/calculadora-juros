import { DEFAULT_TAX_TABLES } from './default-tax-tables';
import { TaxTables } from './tax-tables.model';

/**
 * Funções puras de INSS/IRRF, reaproveitadas por qualquer calculadora que
 * precise delas (salário líquido, férias, 13º...). Não dependem do
 * Angular — as tabelas são passadas como parâmetro (ver
 * `TaxTablesService`), o que as mantém testáveis isoladamente.
 */

/**
 * Calcula o desconto de INSS aplicando a tabela progressiva por faixas
 * (cada faixa é tributada só na parte do salário que está dentro dela),
 * respeitando o teto do salário de contribuição.
 */
export function calculateINSS(grossValue: number, tables: TaxTables = DEFAULT_TAX_TABLES): number {
  const value = Math.min(Math.max(grossValue || 0, 0), tables.inss.ceiling);

  let total = 0;
  let previousLimit = 0;
  for (const bracket of tables.inss.brackets) {
    if (value <= previousLimit) {
      break;
    }
    const upperLimit = Math.min(value, bracket.upTo);
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
 * redutor), nunca negativo. `grossValue` é o rendimento bruto do
 * pagamento em questão (salário do mês, férias, parcela do 13º etc.).
 */
export function applyIrrfReducer(
  grossValue: number,
  irrfFromTable: number,
  tables: TaxTables = DEFAULT_TAX_TABLES,
): number {
  const { exemptUpTo, phaseOutUpTo, constant, factor } = tables.irrf.reducer;

  if (grossValue <= exemptUpTo) {
    return 0;
  }
  if (grossValue > phaseOutUpTo) {
    return irrfFromTable;
  }
  const reducer = Math.max(0, constant - factor * grossValue);
  return Math.max(0, irrfFromTable - reducer);
}

/** Calcula o IRRF final (tabela + redutor) sobre um rendimento bruto e sua base de cálculo já líquida de INSS/dependentes. */
export function calculateIRRF(grossValue: number, base: number, tables: TaxTables = DEFAULT_TAX_TABLES): number {
  const irrfFromTable = calculateIRRFFromTable(base, tables);
  return applyIrrfReducer(grossValue, irrfFromTable, tables);
}
