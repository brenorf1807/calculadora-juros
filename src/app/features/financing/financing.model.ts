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
 * Sistema de amortização usado no cálculo: Tabela Price (`price`,
 * parcelas fixas) ou Sistema de Amortização Constante (`sac`, amortização
 * fixa e parcelas decrescentes). Ver `calculateFinancingPrice` e
 * `calculateFinancingSAC` em `financing.calculations.ts`.
 */
export type AmortizationSystem = 'price' | 'sac';
