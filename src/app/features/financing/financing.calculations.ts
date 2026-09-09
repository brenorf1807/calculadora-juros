import { toMonthlyRate } from '../../core/utils/rate.util';
import { FinancingInput, FinancingInstallment, FinancingResult } from './financing.model';

/**
 * Função pura de cálculo de financiamento pela Tabela Price (parcelas
 * fixas). Não depende do Angular — testável isoladamente.
 */
export function calculateFinancingPrice(input: FinancingInput): FinancingResult {
  const monthlyRate = toMonthlyRate(input.interestRate, input.rateType);
  const installments = Math.max(0, Math.round(input.installments || 0));
  const principal = input.financedAmount || 0;

  const installmentValue = calculateFixedInstallment(principal, monthlyRate, installments);

  const schedule: FinancingInstallment[] = [];
  let balance = principal;

  for (let number = 1; number <= installments; number++) {
    const interest = balance * monthlyRate;
    const amortization = installmentValue - interest;
    balance = Math.max(0, balance - amortization);

    schedule.push({ number, payment: installmentValue, interest, amortization, balance });
  }

  const totalPaid = installmentValue * installments;

  return {
    installmentValue,
    totalPaid,
    totalInterest: installments === 0 ? 0 : totalPaid - principal,
    schedule,
  };
}

function calculateFixedInstallment(principal: number, monthlyRate: number, installments: number): number {
  if (installments === 0) {
    return 0;
  }
  if (monthlyRate === 0) {
    return principal / installments;
  }
  const factor = Math.pow(1 + monthlyRate, installments);
  return (principal * monthlyRate * factor) / (factor - 1);
}

/**
 * Função pura de cálculo de financiamento pelo Sistema de Amortização
 * Constante (SAC). Diferença para a Price: a amortização é fixa
 * (principal / número de parcelas) e o valor da parcela é decrescente,
 * pois os juros incidem sobre um saldo devedor que cai de forma
 * constante. Segue a mesma assinatura de `calculateFinancingPrice`.
 */
export function calculateFinancingSAC(input: FinancingInput): FinancingResult {
  const monthlyRate = toMonthlyRate(input.interestRate, input.rateType);
  const installments = Math.max(0, Math.round(input.installments || 0));
  const principal = input.financedAmount || 0;

  const amortization = installments === 0 ? 0 : principal / installments;

  const schedule: FinancingInstallment[] = [];
  let balance = principal;

  for (let number = 1; number <= installments; number++) {
    const interest = balance * monthlyRate;
    const payment = amortization + interest;
    balance = Math.max(0, balance - amortization);

    schedule.push({ number, payment, interest, amortization, balance });
  }

  const totalPaid = schedule.reduce((sum, row) => sum + row.payment, 0);

  return {
    installmentValue: schedule[0]?.payment ?? 0,
    totalPaid,
    totalInterest: installments === 0 ? 0 : totalPaid - principal,
    schedule,
  };
}
