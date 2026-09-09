import { calculatePayroll } from './payroll.calculations';

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
