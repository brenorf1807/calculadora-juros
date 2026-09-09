import { TaxTables } from './tax-tables.model';

/**
 * Tabelas de INSS e IRRF vigentes em 2026, usadas como valor padrão
 * (bundle offline) e como conteúdo de referência para
 * `public/data/tax-tables-2026.json` — mantenha os dois em sincronia.
 *
 * Usadas por qualquer calculadora que precise de INSS/IRRF (salário
 * líquido, férias, 13º...), via `TaxTablesService` e as funções puras em
 * `core/tax/inss-irrf.calculations.ts`.
 *
 * Fontes: tabela progressiva do INSS e do IRRF (valores amplamente
 * publicados por contabilidades) e o redutor do IRRF da Lei 15.270/2025
 * (vigência 01/01/2026, isenção efetiva até R$5.000 com redução
 * decrescente até R$7.350). Não há hoje uma API pública oficial e
 * gratuita para essas tabelas — por isso elas são versionadas aqui.
 * Revise anualmente quando o governo publicar novos valores.
 */
export const DEFAULT_TAX_TABLES: TaxTables = {
  updatedAt: '2026-01-01',
  source: 'Tabela progressiva INSS/IRRF 2026 + redutor da Lei 15.270/2025',
  inss: {
    ceiling: 8475.55,
    brackets: [
      { upTo: 1621.0, rate: 0.075 },
      { upTo: 2902.84, rate: 0.09 },
      { upTo: 4354.27, rate: 0.12 },
      { upTo: 8475.55, rate: 0.14 },
    ],
  },
  irrf: {
    dependentDeduction: 189.59,
    brackets: [
      { upTo: 2428.8, rate: 0, deduction: 0 },
      { upTo: 2826.65, rate: 0.075, deduction: 182.16 },
      { upTo: 3751.05, rate: 0.15, deduction: 394.16 },
      { upTo: 4664.68, rate: 0.225, deduction: 675.49 },
      { upTo: null, rate: 0.275, deduction: 908.73 },
    ],
    reducer: {
      exemptUpTo: 5000.0,
      phaseOutUpTo: 7350.0,
      constant: 978.62,
      factor: 0.133145,
    },
  },
};
