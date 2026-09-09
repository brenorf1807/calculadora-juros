import { calculateVacation } from './vacation.calculations';

describe('calculateVacation', () => {
  it('calcula o valor bruto das férias com 1/3 constitucional para 30 dias', () => {
    const result = calculateVacation({
      grossSalary: 3000,
      vacationDays: 30,
      dependents: 0,
      anticipateThirteenth: false,
    });

    expect(result.vacationPay).toBeCloseTo(3000, 6);
    expect(result.constitutionalBonus).toBeCloseTo(1000, 6);
    expect(result.grossVacationTotal).toBeCloseTo(4000, 6);
  });

  it('calcula proporcionalmente para menos de 30 dias', () => {
    const result = calculateVacation({
      grossSalary: 3000,
      vacationDays: 15,
      dependents: 0,
      anticipateThirteenth: false,
    });

    expect(result.vacationPay).toBeCloseTo(1500, 6);
    expect(result.constitutionalBonus).toBeCloseTo(500, 6);
  });

  it('desconta INSS e IRRF sobre o total bruto das férias (dias + 1/3)', () => {
    const result = calculateVacation({
      grossSalary: 6000,
      vacationDays: 30,
      dependents: 0,
      anticipateThirteenth: false,
    });

    expect(result.inssDeduction).toBeGreaterThan(0);
    expect(result.netVacationPay).toBeCloseTo(
      result.grossVacationTotal - result.inssDeduction - result.irrfDeduction,
      6,
    );
  });

  it('dependentes reduzem a base de cálculo do IRRF das férias', () => {
    const withoutDependents = calculateVacation({
      grossSalary: 6000,
      vacationDays: 30,
      dependents: 0,
      anticipateThirteenth: false,
    });
    const withDependents = calculateVacation({
      grossSalary: 6000,
      vacationDays: 30,
      dependents: 2,
      anticipateThirteenth: false,
    });

    expect(withDependents.irrfDeduction).toBeLessThanOrEqual(withoutDependents.irrfDeduction);
  });

  it('adianta a 1ª parcela do 13º (50% do salário, sem descontos) quando solicitado', () => {
    const result = calculateVacation({
      grossSalary: 4000,
      vacationDays: 30,
      dependents: 0,
      anticipateThirteenth: true,
    });

    expect(result.thirteenthAdvance).toBeCloseTo(2000, 6);
    expect(result.totalReceivable).toBeCloseTo(result.netVacationPay + 2000, 6);
  });

  it('o breakdown para o gráfico de pizza soma o total bruto movimentado (férias + 13º)', () => {
    const result = calculateVacation({
      grossSalary: 5000,
      vacationDays: 20,
      dependents: 1,
      anticipateThirteenth: true,
    });
    const total = result.breakdown.reduce((sum, item) => sum + item.value, 0);
    expect(total).toBeCloseTo(result.grossVacationTotal + result.thirteenthAdvance, 6);
  });

  // Casos de borda -------------------------------------------------------

  it('caso de borda: dias de férias zero não gera nenhum valor', () => {
    const result = calculateVacation({
      grossSalary: 3000,
      vacationDays: 0,
      dependents: 0,
      anticipateThirteenth: false,
    });

    expect(result.vacationPay).toBe(0);
    expect(result.constitutionalBonus).toBe(0);
    expect(result.inssDeduction).toBe(0);
    expect(result.irrfDeduction).toBe(0);
    expect(result.netVacationPay).toBe(0);
  });

  it('caso de borda: salário bruto zero resulta em tudo zerado', () => {
    const result = calculateVacation({
      grossSalary: 0,
      vacationDays: 30,
      dependents: 0,
      anticipateThirteenth: true,
    });

    expect(result.grossVacationTotal).toBe(0);
    expect(result.thirteenthAdvance).toBe(0);
    expect(result.totalReceivable).toBe(0);
  });

  it('caso de borda: não antecipar o 13º mantém o adiantamento zerado', () => {
    const result = calculateVacation({
      grossSalary: 4000,
      vacationDays: 30,
      dependents: 0,
      anticipateThirteenth: false,
    });

    expect(result.thirteenthAdvance).toBe(0);
    expect(result.totalReceivable).toBeCloseTo(result.netVacationPay, 6);
  });

  it('caso de borda: dias de férias acima de 30 são limitados a 30', () => {
    const result = calculateVacation({
      grossSalary: 3000,
      vacationDays: 45,
      dependents: 0,
      anticipateThirteenth: false,
    });

    expect(result.vacationPay).toBeCloseTo(3000, 6);
  });

  it('caso de borda: salário até R$5.000 tem isenção efetiva de IRRF sobre as férias', () => {
    const result = calculateVacation({
      grossSalary: 3600,
      vacationDays: 30,
      dependents: 0,
      anticipateThirteenth: false,
    });

    // grossVacationTotal = 4800, abaixo do limite de isenção do redutor (5000)
    expect(result.irrfDeduction).toBe(0);
  });
});
