import { RateType, TermUnit } from '../models/rate.model';

/**
 * Converte uma taxa (informada em porcentagem, ex.: 12 para 12%) para a
 * taxa mensal equivalente em formato decimal.
 * Quando a taxa é anual, usa a conversão de juros compostos:
 * i_mensal = (1 + i_anual) ^ (1/12) - 1
 */
export function toMonthlyRate(ratePercent: number, rateType: RateType): number {
  const decimalRate = (ratePercent || 0) / 100;
  if (rateType === 'monthly') {
    return decimalRate;
  }
  return Math.pow(1 + decimalRate, 1 / 12) - 1;
}

/** Converte um prazo (em meses ou anos) para número de meses. */
export function toMonths(term: number, unit: TermUnit): number {
  const value = term || 0;
  return unit === 'years' ? Math.round(value * 12) : Math.round(value);
}
