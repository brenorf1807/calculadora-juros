import { applyIrrfReducer, calculateINSS, calculateIRRFFromTable, calculatePayroll } from './payroll.calculations';
import { DEFAULT_TAX_TABLES } from './tax-tables/default-tax-tables';

describe('calculateINSS', () => {
  it('aplica a alíquota da primeira faixa para salários dentro dela', () => {
    expect(calculateINSS(1000)).toBeCloseTo(1000 * 0.075, 6);
  });

  it('soma progressivamente as faixas para um salário que passa por várias', () => {
    // 1621,00 * 7,5% + (2902,84-1621,00) * 9% + (4000-2902,84) * 12%
    const expected = 1621.0 * 0.075 + (2902.84 - 1621.0) * 0.09 + (4000 - 2902.84) * 0.12;
    expect(calculateINSS(4000)).toBeCloseTo(expected, 2);
  });

  it('caso de borda: respeita o teto do salário de contribuição', () => {
    const atCeiling = calculateINSS(DEFAULT_TAX_TABLES.inss.ceiling);
    const aboveCeiling = calculateINSS(DEFAULT_TAX_TABLES.inss.ceiling + 5000);
    expect(aboveCeiling).toBeCloseTo(atCeiling, 6);
  });

  it('caso de borda: salário zero não gera desconto', () => {
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

describe('calculatePayroll', () => {
  it('calcula o salário líquido descontando INSS, IRRF e outros descontos', () => {
    const result = calculatePayroll({ grossSalary: 3000, dependents: 0, otherDeductions: 100 });

    expect(result.inssDeduction).toBeGreaterThan(0);
    expect(result.netSalary).toBeCloseTo(
      result.grossSalary - result.inssDeduction - result.irrfDeduction - result.otherDeductions,
      6,
    );
  });

  it('dependentes reduzem a base de cálculo do IRRF', () => {
    const withoutDependents = calculatePayroll({ grossSalary: 6000, dependents: 0, otherDeductions: 0 });
    const withDependents = calculatePayroll({ grossSalary: 6000, dependents: 2, otherDeductions: 0 });

    expect(withDependents.irrfBase).toBeLessThan(withoutDependents.irrfBase);
  });

  it('o breakdown para o gráfico de pizza soma o salário bruto', () => {
    const result = calculatePayroll({ grossSalary: 5000, dependents: 1, otherDeductions: 50 });
    const total = result.breakdown.reduce((sum, item) => sum + item.value, 0);
    expect(total).toBeCloseTo(result.grossSalary, 6);
  });

  // Casos de borda -------------------------------------------------------

  it('caso de borda: salário bruto zero resulta em tudo zerado', () => {
    const result = calculatePayroll({ grossSalary: 0, dependents: 0, otherDeductions: 0 });

    expect(result.inssDeduction).toBe(0);
    expect(result.irrfDeduction).toBe(0);
    expect(result.netSalary).toBe(0);
    expect(result.breakdown.length).toBe(0);
  });

  it('caso de borda: dependentes zero não afeta a base do IRRF além do INSS', () => {
    const result = calculatePayroll({ grossSalary: 4000, dependents: 0, otherDeductions: 0 });
    expect(result.irrfBase).toBeCloseTo(4000 - result.inssDeduction, 6);
  });

  it('caso de borda: outros descontos zero não alteram o líquido além de INSS/IRRF', () => {
    const result = calculatePayroll({ grossSalary: 4000, dependents: 0, otherDeductions: 0 });
    expect(result.netSalary).toBeCloseTo(4000 - result.inssDeduction - result.irrfDeduction, 6);
  });

  it('caso de borda: renda até R$5.000 tem isenção efetiva de IRRF mesmo sem dependentes', () => {
    const result = calculatePayroll({ grossSalary: 5000, dependents: 0, otherDeductions: 0 });
    expect(result.irrfDeduction).toBe(0);
  });
});
