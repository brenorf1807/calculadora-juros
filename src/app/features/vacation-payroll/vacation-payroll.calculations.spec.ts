import { calculateINSS, calculateIRRF } from '../../core/tax/inss-irrf.calculations';
import { DEFAULT_TAX_TABLES } from '../../core/tax/default-tax-tables';
import { calculatePayroll } from '../payroll/payroll.calculations';
import { calculateVacation } from '../vacation/vacation.calculations';
import { calculateVacationPayroll } from './vacation-payroll.calculations';

describe('calculateVacationPayroll', () => {
  it('divide o salário entre dias trabalhados e dias de férias', () => {
    const result = calculateVacationPayroll({
      grossSalary: 3000,
      vacationDays: 10,
      dependents: 0,
      otherDeductions: 0,
      anticipateThirteenth: false,
    });

    expect(result.workedDays).toBe(20);
    expect(result.proportionalSalary).toBeCloseTo(2000, 6);
    expect(result.vacationPay).toBeCloseTo(1000, 6);
    expect(result.constitutionalBonus).toBeCloseTo(333.33, 2);
  });

  it('caso de borda: 0 dias de férias equivale a um mês normal (sem 1/3) e bate com o Salário Líquido', () => {
    const result = calculateVacationPayroll({
      grossSalary: 5000,
      vacationDays: 0,
      dependents: 2,
      otherDeductions: 100,
      anticipateThirteenth: false,
    });
    const payroll = calculatePayroll({ grossSalary: 5000, dependents: 2, otherDeductions: 100 });

    expect(result.grossTotal).toBeCloseTo(5000, 6);
    expect(result.inssDeduction).toBeCloseTo(payroll.inssDeduction, 6);
    expect(result.irrfDeduction).toBeCloseTo(payroll.irrfDeduction, 6);
    expect(result.netTotal).toBeCloseTo(payroll.netSalary, 6);
  });

  it('caso de borda: 30 dias de férias equivale ao mês inteiro de férias e bate com a calculadora de Férias', () => {
    const result = calculateVacationPayroll({
      grossSalary: 5000,
      vacationDays: 30,
      dependents: 1,
      otherDeductions: 0,
      anticipateThirteenth: false,
    });
    const vacation = calculateVacation({
      grossSalary: 5000,
      vacationDays: 30,
      dependents: 1,
      anticipateThirteenth: false,
    });

    expect(result.workedDays).toBe(0);
    expect(result.proportionalSalary).toBe(0);
    expect(result.grossTotal).toBeCloseTo(vacation.grossVacationTotal, 6);
    expect(result.inssDeduction).toBeCloseTo(vacation.inssDeduction, 6);
    expect(result.irrfDeduction).toBeCloseTo(vacation.irrfDeduction, 6);
  });

  it('respeita um único teto do INSS sobre o total do mês, mesmo perto do limite', () => {
    const ceiling = 8475.55;
    const result = calculateVacationPayroll({
      grossSalary: ceiling,
      vacationDays: 15,
      dependents: 0,
      otherDeductions: 0,
      anticipateThirteenth: false,
    });

    // grossTotal (salário proporcional + férias + 1/3) ultrapassa o teto,
    // então o INSS não pode passar do valor máximo da tabela.
    expect(result.grossTotal).toBeGreaterThan(ceiling);
    expect(result.inssDeduction).toBeCloseTo(calculateINSS(ceiling), 6);
  });

  it('o INSS unificado é menor do que somar Salário e Férias calculados separadamente perto do teto', () => {
    const grossSalary = 8475.55; // no teto
    const vacationDays = 15;

    const unified = calculateVacationPayroll({
      grossSalary,
      vacationDays,
      dependents: 0,
      otherDeductions: 0,
      anticipateThirteenth: false,
    });

    // Erro comum de planilha: usar o salário cheio na calculadora de
    // Salário Líquido e, à parte, o valor das férias na calculadora de
    // Férias — cada uma aplica o teto do INSS isoladamente.
    const naiveSalaryPortion = calculatePayroll({ grossSalary, dependents: 0, otherDeductions: 0 });
    const naiveVacationPortion = calculateVacation({
      grossSalary,
      vacationDays,
      dependents: 0,
      anticipateThirteenth: false,
    });
    const naiveTotalInss = naiveSalaryPortion.inssDeduction + naiveVacationPortion.inssDeduction;

    expect(unified.inssDeduction).toBeLessThan(naiveTotalInss);
  });

  it('calcula o IRRF separadamente para salário e férias, com o INSS rateado entre as duas partes (RIR/2018, art. 625)', () => {
    const grossSalary = 9000;
    const vacationDays = 10;
    const dependents = 1;

    const result = calculateVacationPayroll({
      grossSalary,
      vacationDays,
      dependents,
      otherDeductions: 0,
      anticipateThirteenth: false,
    });

    // Reproduz o algoritmo esperado: INSS único sobre o total, rateado
    // proporcionalmente, e IRRF apurado em separado para cada parte.
    const workedDays = 30 - vacationDays;
    const dailyRate = grossSalary / 30;
    const proportionalSalary = dailyRate * workedDays;
    const vacationPay = dailyRate * vacationDays;
    const vacationGross = vacationPay + vacationPay / 3;
    const grossTotal = proportionalSalary + vacationGross;

    const expectedInss = calculateINSS(grossTotal);
    const salaryShare = proportionalSalary / grossTotal;
    const inssOnSalary = expectedInss * salaryShare;
    const inssOnVacation = expectedInss - inssOnSalary;
    const dependentDeduction = dependents * DEFAULT_TAX_TABLES.irrf.dependentDeduction;

    const expectedSalaryIrrf = calculateIRRF(
      proportionalSalary,
      Math.max(0, proportionalSalary - inssOnSalary - dependentDeduction),
    );
    const expectedVacationIrrf = calculateIRRF(
      vacationGross,
      Math.max(0, vacationGross - inssOnVacation - dependentDeduction),
    );

    expect(result.inssDeduction).toBeCloseTo(expectedInss, 6);
    expect(result.irrfDeduction).toBeCloseTo(expectedSalaryIrrf + expectedVacationIrrf, 6);
  });

  it('a dedução por dependente vale integralmente tanto no salário quanto nas férias, sem prejuízo mútuo', () => {
    const withoutDependents = calculateVacationPayroll({
      grossSalary: 9000,
      vacationDays: 10,
      dependents: 0,
      otherDeductions: 0,
      anticipateThirteenth: false,
    });
    const withDependents = calculateVacationPayroll({
      grossSalary: 9000,
      vacationDays: 10,
      dependents: 3,
      otherDeductions: 0,
      anticipateThirteenth: false,
    });

    expect(withDependents.irrfDeduction).toBeLessThan(withoutDependents.irrfDeduction);
  });

  it('adianta a 1ª parcela do 13º (50% do salário, sem descontos) quando solicitado', () => {
    const result = calculateVacationPayroll({
      grossSalary: 4000,
      vacationDays: 20,
      dependents: 0,
      otherDeductions: 0,
      anticipateThirteenth: true,
    });

    expect(result.thirteenthAdvance).toBeCloseTo(2000, 6);
    expect(result.totalReceivable).toBeCloseTo(result.netTotal + 2000, 6);
  });

  it('o breakdown para o gráfico de pizza soma o total bruto movimentado (mês + 13º)', () => {
    const result = calculateVacationPayroll({
      grossSalary: 5000,
      vacationDays: 12,
      dependents: 1,
      otherDeductions: 50,
      anticipateThirteenth: true,
    });
    const total = result.breakdown.reduce((sum, item) => sum + item.value, 0);
    expect(total).toBeCloseTo(result.grossTotal + result.thirteenthAdvance, 6);
  });

  // Casos de borda -------------------------------------------------------

  it('caso de borda: salário bruto zero resulta em tudo zerado', () => {
    const result = calculateVacationPayroll({
      grossSalary: 0,
      vacationDays: 15,
      dependents: 0,
      otherDeductions: 0,
      anticipateThirteenth: true,
    });

    expect(result.grossTotal).toBe(0);
    expect(result.inssDeduction).toBe(0);
    expect(result.irrfDeduction).toBe(0);
    expect(result.thirteenthAdvance).toBe(0);
    expect(result.totalReceivable).toBe(0);
  });

  it('caso de borda: não antecipar o 13º mantém o adiantamento zerado', () => {
    const result = calculateVacationPayroll({
      grossSalary: 4000,
      vacationDays: 10,
      dependents: 0,
      otherDeductions: 0,
      anticipateThirteenth: false,
    });

    expect(result.thirteenthAdvance).toBe(0);
    expect(result.totalReceivable).toBeCloseTo(result.netTotal, 6);
  });

  it('caso de borda: dias de férias acima de 30 são limitados a 30', () => {
    const result = calculateVacationPayroll({
      grossSalary: 3000,
      vacationDays: 45,
      dependents: 0,
      otherDeductions: 0,
      anticipateThirteenth: false,
    });

    expect(result.workedDays).toBe(0);
    expect(result.vacationPay).toBeCloseTo(3000, 6);
  });
});
