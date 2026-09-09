import { RateType } from '../../core/models/rate.model';

export interface FinancingInput {
  financedAmount: number;
  interestRate: number;
  rateType: RateType;
  installments: number;
}

export interface FinancingInstallment {
  number: number;
  payment: number;
  interest: number;
  amortization: number;
  balance: number;
  /** Permite que a linha seja consumida pelo <app-schedule-table> genérico. */
  [key: string]: number;
}

export interface FinancingResult {
  installmentValue: number;
  totalPaid: number;
  totalInterest: number;
  schedule: FinancingInstallment[];
}

/**
 * Sistema de amortização usado no cálculo. Hoje só a Tabela Price
 * (`price`) está implementada — ver `calculateFinancingPrice` em
 * `financing.calculations.ts`. O Sistema de Amortização Constante (`sac`)
 * está reservado aqui e na UI para ser adicionado futuramente, seguindo a
 * mesma assinatura `(input: FinancingInput) => FinancingResult`.
 */
export type AmortizationSystem = 'price' | 'sac';
