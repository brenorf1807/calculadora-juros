import { toMonthlyRate, toMonths } from '../../core/utils/rate.util';
import {
  CompoundInterestInput,
  CompoundInterestPeriod,
  CompoundInterestResult,
} from './compound-interest.model';

/**
 * Função pura de cálculo de juros compostos com aportes mensais.
 * Não depende do Angular — pode ser testada isoladamente e reutilizada
 * (por exemplo, futuramente numa calculadora de aposentadoria).
 */
export function calculateCompoundInterest(input: CompoundInterestInput): CompoundInterestResult {
  const months = toMonths(input.term, input.termUnit);
  const monthlyRate = toMonthlyRate(input.interestRate, input.rateType);
  const contribution = input.monthlyContribution || 0;

  const schedule: CompoundInterestPeriod[] = [];
  let balance = input.initialValue || 0;
  let totalInvested = balance;

  for (let period = 1; period <= months; period++) {
    const interest = balance * monthlyRate;
    balance += interest + contribution;
    totalInvested += contribution;

    schedule.push({ period, contribution, interest, balance });
  }

  return {
    finalBalance: balance,
    totalInvested,
    totalInterest: balance - totalInvested,
    schedule,
  };
}
