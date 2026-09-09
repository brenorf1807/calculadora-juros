import {
  applyIrrfReducer,
  calculateINSS,
  calculateIRRF,
  calculateIRRFFromTable,
} from './inss-irrf.calculations';
import { DEFAULT_TAX_TABLES } from './default-tax-tables';

describe('calculateINSS', () => {
  it('aplica a alíquota da primeira faixa para valores dentro dela', () => {
    expect(calculateINSS(1000)).toBeCloseTo(1000 * 0.075, 6);
  });

  it('soma progressivamente as faixas para um valor que passa por várias', () => {
    const expected = 1621.0 * 0.075 + (2902.84 - 1621.0) * 0.09 + (4000 - 2902.84) * 0.12;
    expect(calculateINSS(4000)).toBeCloseTo(expected, 2);
  });

  it('caso de borda: respeita o teto do salário de contribuição', () => {
    const atCeiling = calculateINSS(DEFAULT_TAX_TABLES.inss.ceiling);
    const aboveCeiling = calculateINSS(DEFAULT_TAX_TABLES.inss.ceiling + 5000);
    expect(aboveCeiling).toBeCloseTo(atCeiling, 6);
  });

  it('caso de borda: valor zero não gera desconto', () => {
    expect(calculateINSS(0)).toBe(0);
  });
});

describe('calculateIRRFFromTable', () => {
  it('caso de borda: base dentro da faixa isenta não gera imposto', () => {
    expect(calculateIRRFFromTable(2000)).toBe(0);
  });

  it('aplica alíquota e parcela a deduzir da faixa correspondente', () => {
    const base = 5000;
    const expected = base * 0.275 - 908.73;
    expect(calculateIRRFFromTable(base)).toBeCloseTo(expected, 6);
  });

  it('caso de borda: base zero não gera imposto', () => {
    expect(calculateIRRFFromTable(0)).toBe(0);
  });
});

describe('applyIrrfReducer (Lei 15.270/2025)', () => {
  it('caso de borda: zera o IRRF para renda bruta até o limite de isenção', () => {
    expect(applyIrrfReducer(5000, 466.27)).toBe(0);
  });

  it('reduz o imposto na faixa intermediária sem deixá-lo negativo', () => {
    const irrfFromTable = calculateIRRFFromTable(6000 - calculateINSS(6000));
    const result = applyIrrfReducer(6000, irrfFromTable);
    expect(result).toBeLessThan(irrfFromTable);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('caso de borda: não aplica redutor acima do limite superior', () => {
    const irrfFromTable = calculateIRRFFromTable(8000);
    expect(applyIrrfReducer(8000, irrfFromTable)).toBe(irrfFromTable);
  });
});

describe('calculateIRRF (tabela + redutor combinados)', () => {
  it('caso de borda: renda até R$5.000 é isenta mesmo com base tributável alta', () => {
    expect(calculateIRRF(5000, 4800)).toBe(0);
  });

  it('aplica a tabela normalmente para renda acima do teto do redutor', () => {
    const base = 8000;
    expect(calculateIRRF(9000, base)).toBeCloseTo(calculateIRRFFromTable(base), 6);
  });
});
