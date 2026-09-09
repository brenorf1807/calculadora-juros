import { calculateFinancingPrice, calculateFinancingSAC } from './financing.calculations';

describe('calculateFinancingPrice', () => {
  it('calcula a parcela fixa pela fórmula da Tabela Price', () => {
    const result = calculateFinancingPrice({
      financedAmount: 10000,
      interestRate: 1,
      rateType: 'monthly',
      installments: 12,
    });

    const i = 0.01;
    const factor = Math.pow(1 + i, 12);
    const expectedInstallment = (10000 * i * factor) / (factor - 1);

    expect(result.installmentValue).toBeCloseTo(expectedInstallment, 2);
    expect(result.schedule.length).toBe(12);
    expect(result.totalPaid).toBeCloseTo(expectedInstallment * 12, 2);
  });

  it('zera o saldo devedor ao final do financiamento', () => {
    const result = calculateFinancingPrice({
      financedAmount: 5000,
      interestRate: 2,
      rateType: 'monthly',
      installments: 6,
    });

    const lastInstallment = result.schedule[result.schedule.length - 1];
    expect(lastInstallment.balance).toBeCloseTo(0, 2);
  });

  it('a soma das amortizações é igual ao valor financiado', () => {
    const result = calculateFinancingPrice({
      financedAmount: 8000,
      interestRate: 1.5,
      rateType: 'monthly',
      installments: 10,
    });

    const totalAmortization = result.schedule.reduce((sum, row) => sum + row.amortization, 0);
    expect(totalAmortization).toBeCloseTo(8000, 2);
  });

  // Casos de borda -------------------------------------------------------

  it('caso de borda: número de parcelas zero não gera cronograma', () => {
    const result = calculateFinancingPrice({
      financedAmount: 10000,
      interestRate: 1,
      rateType: 'monthly',
      installments: 0,
    });

    expect(result.schedule.length).toBe(0);
    expect(result.installmentValue).toBe(0);
    expect(result.totalPaid).toBe(0);
    expect(result.totalInterest).toBe(0);
  });

  it('caso de borda: taxa zero divide o valor financiado igualmente, sem juros', () => {
    const result = calculateFinancingPrice({
      financedAmount: 1200,
      interestRate: 0,
      rateType: 'monthly',
      installments: 12,
    });

    expect(result.installmentValue).toBeCloseTo(100, 6);
    expect(result.totalInterest).toBeCloseTo(0, 6);
    expect(result.schedule.every((row) => row.interest === 0)).toBe(true);
  });

  it('caso de borda: valor financiado zero resulta em parcelas zeradas', () => {
    const result = calculateFinancingPrice({
      financedAmount: 0,
      interestRate: 1,
      rateType: 'monthly',
      installments: 5,
    });

    expect(result.installmentValue).toBeCloseTo(0, 6);
    expect(result.totalPaid).toBeCloseTo(0, 6);
  });
});

describe('calculateFinancingSAC', () => {
  it('mantém a amortização fixa e a parcela decrescente', () => {
    const result = calculateFinancingSAC({
      financedAmount: 12000,
      interestRate: 1,
      rateType: 'monthly',
      installments: 12,
    });

    expect(result.schedule.every((row) => row.amortization === 1000)).toBe(true);
    for (let i = 1; i < result.schedule.length; i++) {
      expect(result.schedule[i].payment).toBeLessThan(result.schedule[i - 1].payment);
    }
  });

  it('zera o saldo devedor ao final do financiamento', () => {
    const result = calculateFinancingSAC({
      financedAmount: 5000,
      interestRate: 2,
      rateType: 'monthly',
      installments: 6,
    });

    const lastInstallment = result.schedule[result.schedule.length - 1];
    expect(lastInstallment.balance).toBeCloseTo(0, 6);
  });

  it('a soma das amortizações é igual ao valor financiado', () => {
    const result = calculateFinancingSAC({
      financedAmount: 8000,
      interestRate: 1.5,
      rateType: 'monthly',
      installments: 10,
    });

    const totalAmortization = result.schedule.reduce((sum, row) => sum + row.amortization, 0);
    expect(totalAmortization).toBeCloseTo(8000, 6);
  });

  // Casos de borda -------------------------------------------------------

  it('caso de borda: número de parcelas zero não gera cronograma', () => {
    const result = calculateFinancingSAC({
      financedAmount: 10000,
      interestRate: 1,
      rateType: 'monthly',
      installments: 0,
    });

    expect(result.schedule.length).toBe(0);
    expect(result.installmentValue).toBe(0);
    expect(result.totalPaid).toBe(0);
    expect(result.totalInterest).toBe(0);
  });

  it('caso de borda: taxa zero resulta em parcelas iguais (só amortização), sem juros', () => {
    const result = calculateFinancingSAC({
      financedAmount: 1200,
      interestRate: 0,
      rateType: 'monthly',
      installments: 12,
    });

    expect(result.schedule.every((row) => row.payment === 100)).toBe(true);
    expect(result.totalInterest).toBeCloseTo(0, 6);
  });

  it('caso de borda: valor financiado zero resulta em parcelas zeradas', () => {
    const result = calculateFinancingSAC({
      financedAmount: 0,
      interestRate: 1,
      rateType: 'monthly',
      installments: 5,
    });

    expect(result.installmentValue).toBeCloseTo(0, 6);
    expect(result.totalPaid).toBeCloseTo(0, 6);
  });
});
