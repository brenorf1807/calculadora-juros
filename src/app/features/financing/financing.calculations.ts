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
 * Placeholder para o Sistema de Amortização Constante (SAC).
 *
 * Diferença para a Price: no SAC a amortização é fixa (principal / número
 * de parcelas) e o valor da parcela é decrescente, pois os juros incidem
 * sobre um saldo devedor que cai de forma constante. Ainda não
 * implementado — quando for, deve seguir a mesma assinatura de
 * `calculateFinancingPrice` para que a página de financiamento só precise
 * trocar qual função chamar de acordo com `AmortizationSystem`.
 */
export function calculateFinancingSAC(_input: FinancingInput): FinancingResult {
  throw new Error('Sistema de Amortização Constante (SAC) ainda não implementado.');
}
