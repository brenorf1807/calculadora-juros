import { toMonthlyRate, toMonths } from './rate.util';

describe('rate.util', () => {
  describe('toMonthlyRate', () => {
    it('retorna a própria taxa (em decimal) quando o tipo é mensal', () => {
      expect(toMonthlyRate(1.5, 'monthly')).toBeCloseTo(0.015, 6);
    });

    it('converte taxa anual para mensal equivalente', () => {
      const monthly = toMonthlyRate(12.6825, 'annual');
      // (1 + 0.126825)^(1/12) - 1 ≈ 0.01
      expect(monthly).toBeCloseTo(0.01, 3);
    });

    it('retorna zero quando a taxa é zero', () => {
      expect(toMonthlyRate(0, 'monthly')).toBe(0);
      expect(toMonthlyRate(0, 'annual')).toBe(0);
    });
  });

  describe('toMonths', () => {
    it('mantém o valor quando a unidade é meses', () => {
      expect(toMonths(24, 'months')).toBe(24);
    });

    it('multiplica por 12 quando a unidade é anos', () => {
      expect(toMonths(2, 'years')).toBe(24);
    });

    it('retorna zero para prazo zero', () => {
      expect(toMonths(0, 'months')).toBe(0);
      expect(toMonths(0, 'years')).toBe(0);
    });
  });
});
