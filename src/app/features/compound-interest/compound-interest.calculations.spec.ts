import { calculateCompoundInterest } from './compound-interest.calculations';

describe('calculateCompoundInterest', () => {
  it('calcula corretamente um caso simples sem aporte', () => {
    const result = calculateCompoundInterest({
      initialValue: 1000,
      monthlyContribution: 0,
      interestRate: 1,
      rateType: 'monthly',
      term: 12,
      termUnit: 'months',
    });

    const expectedFinal = 1000 * Math.pow(1.01, 12);
    expect(result.finalBalance).toBeCloseTo(expectedFinal, 2);
    expect(result.totalInvested).toBe(1000);
    expect(result.totalInterest).toBeCloseTo(expectedFinal - 1000, 2);
    expect(result.schedule.length).toBe(12);
  });

  it('soma aportes mensais ao total investido e ao saldo', () => {
    const result = calculateCompoundInterest({
      initialValue: 0,
      monthlyContribution: 100,
      interestRate: 0,
      rateType: 'monthly',
      term: 10,
      termUnit: 'months',
    });

    expect(result.totalInvested).toBe(1000);
    expect(result.finalBalance).toBe(1000);
    expect(result.totalInterest).toBeCloseTo(0, 6);
  });

  it('converte prazo em anos para meses corretamente', () => {
    const result = calculateCompoundInterest({
      initialValue: 1000,
      monthlyContribution: 0,
      interestRate: 0,
      rateType: 'monthly',
      term: 1,
      termUnit: 'years',
    });

    expect(result.schedule.length).toBe(12);
  });

  // Casos de borda -------------------------------------------------------

  it('caso de borda: prazo zero retorna o valor inicial sem alterações', () => {
    const result = calculateCompoundInterest({
      initialValue: 500,
      monthlyContribution: 200,
      interestRate: 2,
      rateType: 'monthly',
      term: 0,
      termUnit: 'months',
    });

    expect(result.schedule.length).toBe(0);
    expect(result.finalBalance).toBe(500);
    expect(result.totalInvested).toBe(500);
    expect(result.totalInterest).toBe(0);
  });

  it('caso de borda: taxa zero não gera juros, apenas soma os aportes', () => {
    const result = calculateCompoundInterest({
      initialValue: 1000,
      monthlyContribution: 50,
      interestRate: 0,
      rateType: 'monthly',
      term: 6,
      termUnit: 'months',
    });

    expect(result.finalBalance).toBe(1000 + 50 * 6);
    expect(result.totalInterest).toBeCloseTo(0, 6);
  });

  it('caso de borda: aporte zero rende juros apenas sobre o valor inicial', () => {
    const result = calculateCompoundInterest({
      initialValue: 1000,
      monthlyContribution: 0,
      interestRate: 1,
      rateType: 'monthly',
      term: 3,
      termUnit: 'months',
    });

    expect(result.totalInvested).toBe(1000);
    expect(result.finalBalance).toBeGreaterThan(1000);
  });
});
