import { calculateINSS, calculateIRRF } from '../../core/tax/inss-irrf.calculations';
import { calculateTermination } from './termination.calculations';
import { TerminationInput } from './termination.model';

const BASE_INPUT: TerminationInput = {
  grossSalary: 3000,
  reason: 'without_cause',
  daysWorkedInMonth: 10,
  monthsWorkedInYear: 6,
  monthsWorkedInVacationPeriod: 6,
  hasUnusedVacation: false,
  yearsOfService: 3,
  fgtsBalance: 5000,
  noticeType: 'indemnified',
  noticeWorkedByEmployee: true,
  dependents: 0,
};

describe('calculateTermination', () => {
  describe('aviso prévio proporcional (Lei 12.506/2011)', () => {
    it('caso de borda: até 1 ano de serviço, o aviso é de 30 dias', () => {
      const result = calculateTermination({ ...BASE_INPUT, yearsOfService: 1 });
      expect(result.noticeDays).toBe(30);
    });

    it('soma 3 dias por ano completo além do primeiro', () => {
      const result = calculateTermination({ ...BASE_INPUT, yearsOfService: 3 });
      expect(result.noticeDays).toBe(36); // 30 + (3-1)*3
    });

    it('caso de borda: nunca ultrapassa 90 dias', () => {
      const result = calculateTermination({ ...BASE_INPUT, yearsOfService: 40 });
      expect(result.noticeDays).toBe(90);
    });
  });

  describe('dispensa sem justa causa', () => {
    it('calcula todas as verbas devidas com aviso indenizado', () => {
      const result = calculateTermination({
        ...BASE_INPUT,
        reason: 'without_cause',
        noticeType: 'indemnified',
        hasUnusedVacation: true,
      });

      expect(result.balanceSalary).toBeCloseTo((3000 / 30) * 10, 6);
      expect(result.noticeAmount).toBeGreaterThan(0);
      expect(result.thirteenthSalary).toBeGreaterThan(0);
      expect(result.unusedVacation).toBeCloseTo(3000 * (4 / 3), 6);
      expect(result.proportionalVacation).toBeGreaterThan(0);
      expect(result.fgtsFine).toBeCloseTo(5000 * 0.4, 6);
      expect(result.noticeDiscount).toBe(0);
    });

    it('a projeção do aviso indenizado aumenta o 13º e as férias proporcionais', () => {
      const indemnified = calculateTermination({ ...BASE_INPUT, noticeType: 'indemnified' });
      const worked = calculateTermination({ ...BASE_INPUT, noticeType: 'worked' });

      expect(indemnified.thirteenthSalary).toBeGreaterThan(worked.thirteenthSalary);
      expect(indemnified.proportionalVacation).toBeGreaterThan(worked.proportionalVacation);
    });

    it('aviso prévio trabalhado não gera valor de indenização', () => {
      const result = calculateTermination({ ...BASE_INPUT, noticeType: 'worked' });
      expect(result.noticeAmount).toBe(0);
    });

    it('aviso prévio, férias e multa do FGTS são isentos de INSS/IRRF (não reduzem o breakdown)', () => {
      const result = calculateTermination({
        ...BASE_INPUT,
        hasUnusedVacation: true,
      });

      const noticeItem = result.breakdown.find((item) => item.label === 'Aviso prévio');
      const unusedVacationItem = result.breakdown.find((item) => item.label === 'Férias vencidas');
      const fgtsItem = result.breakdown.find((item) => item.label === 'Multa FGTS');

      expect(noticeItem?.value).toBeCloseTo(result.noticeAmount, 6);
      expect(unusedVacationItem?.value).toBeCloseTo(result.unusedVacation, 6);
      expect(fgtsItem?.value).toBeCloseTo(result.fgtsFine, 6);
    });
  });

  describe('dispensa por justa causa', () => {
    it('não gera aviso prévio, 13º proporcional, férias proporcionais nem multa do FGTS', () => {
      const result = calculateTermination({ ...BASE_INPUT, reason: 'with_cause', hasUnusedVacation: true });

      expect(result.noticeAmount).toBe(0);
      expect(result.thirteenthSalary).toBe(0);
      expect(result.proportionalVacation).toBe(0);
      expect(result.fgtsFine).toBe(0);
    });

    it('ainda assim paga o saldo de salário e férias vencidas, se houver', () => {
      const result = calculateTermination({ ...BASE_INPUT, reason: 'with_cause', hasUnusedVacation: true });

      expect(result.balanceSalary).toBeGreaterThan(0);
      expect(result.unusedVacation).toBeCloseTo(3000 * (4 / 3), 6);
    });
  });

  describe('pedido de demissão', () => {
    it('sem multa de FGTS, mas com 13º e férias proporcionais', () => {
      const result = calculateTermination({ ...BASE_INPUT, reason: 'resignation', noticeWorkedByEmployee: true });

      expect(result.fgtsFine).toBe(0);
      expect(result.thirteenthSalary).toBeGreaterThan(0);
      expect(result.proportionalVacation).toBeGreaterThan(0);
      expect(result.noticeDiscount).toBe(0);
    });

    it('desconta um salário quando o empregado não cumpre o aviso prévio', () => {
      const result = calculateTermination({
        ...BASE_INPUT,
        reason: 'resignation',
        noticeWorkedByEmployee: false,
      });

      expect(result.noticeDiscount).toBeCloseTo(3000, 6);
      expect(result.netTotal).toBeLessThan(
        calculateTermination({ ...BASE_INPUT, reason: 'resignation', noticeWorkedByEmployee: true }).netTotal,
      );
    });
  });

  describe('rescisão por acordo (art. 484-A da CLT)', () => {
    it('aviso prévio pago pela metade e multa do FGTS de 20%', () => {
      const withoutCause = calculateTermination({ ...BASE_INPUT, reason: 'without_cause' });
      const agreement = calculateTermination({ ...BASE_INPUT, reason: 'mutual_agreement' });

      expect(agreement.noticeAmount).toBeCloseTo(withoutCause.noticeAmount / 2, 6);
      expect(agreement.fgtsFine).toBeCloseTo(5000 * 0.2, 6);
    });
  });

  describe('tributação', () => {
    it('saldo de salário e 13º são tributados de forma independente (mesmo padrão do resto da app)', () => {
      const result = calculateTermination(BASE_INPUT);

      const expectedBalanceInss = calculateINSS(result.balanceSalary);
      const expectedThirteenthInss = calculateINSS(result.thirteenthSalary);

      expect(result.balanceSalaryInss).toBeCloseTo(expectedBalanceInss, 6);
      expect(result.thirteenthInss).toBeCloseTo(expectedThirteenthInss, 6);
      expect(result.balanceSalaryIrrf).toBeCloseTo(
        calculateIRRF(result.balanceSalary, Math.max(0, result.balanceSalary - expectedBalanceInss)),
        6,
      );
    });

    it('caso de borda: rendimentos baixos não geram IRRF (faixa de isenção)', () => {
      const result = calculateTermination({ ...BASE_INPUT, grossSalary: 1000 });
      expect(result.balanceSalaryIrrf).toBe(0);
      expect(result.thirteenthIrrf).toBe(0);
    });
  });

  describe('casos de borda gerais', () => {
    it('salário bruto zero resulta em tudo zerado', () => {
      const result = calculateTermination({ ...BASE_INPUT, grossSalary: 0, fgtsBalance: 0 });

      expect(result.balanceSalary).toBe(0);
      expect(result.noticeAmount).toBe(0);
      expect(result.thirteenthSalary).toBe(0);
      expect(result.netTotal).toBe(0);
    });

    it('sem férias vencidas, o valor correspondente é zero', () => {
      const result = calculateTermination({ ...BASE_INPUT, hasUnusedVacation: false });
      expect(result.unusedVacation).toBe(0);
    });

    it('meses trabalhados zero não gera 13º nem férias proporcionais', () => {
      const result = calculateTermination({
        ...BASE_INPUT,
        monthsWorkedInYear: 0,
        monthsWorkedInVacationPeriod: 0,
        noticeType: 'worked',
      });

      expect(result.thirteenthSalary).toBe(0);
      expect(result.proportionalVacation).toBe(0);
    });

    it('o líquido total é a soma bruta menos INSS, IRRF e o desconto de aviso não cumprido', () => {
      const result = calculateTermination(BASE_INPUT);
      expect(result.netTotal).toBeCloseTo(
        result.grossTotal - result.totalInss - result.totalIrrf - result.noticeDiscount,
        6,
      );
    });
  });
});
