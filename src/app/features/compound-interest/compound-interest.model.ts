import { RateType, TermUnit } from '../../core/models/rate.model';

export interface CompoundInterestInput {
  initialValue: number;
  monthlyContribution: number;
  interestRate: number;
  rateType: RateType;
  term: number;
  termUnit: TermUnit;
}

export interface CompoundInterestPeriod {
  period: number;
  contribution: number;
  interest: number;
  balance: number;
  /** Permite que a linha seja consumida pelo <app-schedule-table> genérico. */
  [key: string]: number;
}

export interface CompoundInterestResult {
  finalBalance: number;
  totalInvested: number;
  totalInterest: number;
  schedule: CompoundInterestPeriod[];
}
