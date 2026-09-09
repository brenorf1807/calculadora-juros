export interface InssBracket {
  /** Limite superior da faixa (R$). A última faixa costuma coincidir com o teto do INSS. */
  upTo: number;
  /** Alíquota da faixa, em decimal (ex.: 0.075 = 7,5%). */
  rate: number;
}

export interface IrrfBracket {
  /** Limite superior da faixa (R$). `null` na última faixa (sem limite superior). */
  upTo: number | null;
  /** Alíquota da faixa, em decimal (ex.: 0.275 = 27,5%). */
  rate: number;
  /** Parcela a deduzir do imposto apurado nessa faixa (R$). */
  deduction: number;
}

/**
 * Redutor do IRRF criado pela Lei 15.270/2025 (vigência: 01/01/2026).
 * Não reescreve a tabela progressiva — soma um redutor sobre o imposto já
 * apurado por ela, dando isenção efetiva a quem ganha até `exemptUpTo` e
 * uma redução decrescente até `phaseOutUpTo`.
 * Redutor = constant - (factor * rendimentoBrutoMensal)
 */
export interface IrrfReducer {
  exemptUpTo: number;
  phaseOutUpTo: number;
  constant: number;
  factor: number;
}

export interface TaxTables {
  updatedAt: string;
  source: string;
  inss: {
    ceiling: number;
    brackets: InssBracket[];
  };
  irrf: {
    dependentDeduction: number;
    brackets: IrrfBracket[];
    reducer: IrrfReducer;
  };
}
